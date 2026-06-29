import os
import re
import json
import logging
import hashlib
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple
from openai import OpenAI

from .agents.base import AgentOutput
from .config import OLLAMA_BASE_URL, OLLAMA_MODEL
from .db import (
    get_source_registry_entry,
    insert_aligned_state,
    get_latest_version,
    IS_DB_CONFIGURED,
    SUPABASE_URL,
    SUPABASE_KEY
)

logger = logging.getLogger(__name__)

def parse_interval(interval_str: str) -> timedelta:
    """Parse PG interval string (e.g., '2 minutes', '1 day') into timedelta."""
    if not interval_str:
        return timedelta(seconds=120)
        
    interval_str = interval_str.lower().strip()
    
    # Days
    days_match = re.search(r'(\d+)\s*day', interval_str)
    days = int(days_match.group(1)) if days_match else 0
    
    # Hours
    hours_match = re.search(r'(\d+)\s*hour', interval_str)
    hours = int(hours_match.group(1)) if hours_match else 0
    
    # Minutes
    minutes_match = re.search(r'(\d+)\s*min', interval_str)
    minutes = int(minutes_match.group(1)) if minutes_match else 0
    
    # Seconds
    seconds_match = re.search(r'(\d+)\s*sec', interval_str)
    seconds = int(seconds_match.group(1)) if seconds_match else 0
    
    if not (days or hours or minutes or seconds):
        # Default fallback to 2 minutes
        return timedelta(seconds=120)
        
    return timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)

def broadcast_realtime_event(state: dict):
    """Trigger a custom channel broadcast in Supabase Realtime."""
    if not IS_DB_CONFIGURED:
        return
    url = f"{SUPABASE_URL.rstrip('/')}/realtime/v1/api/broadcast"
    headers = {
        "apikey": SUPABASE_KEY or "",
        "Authorization": f"Bearer {SUPABASE_KEY or ''}",
        "Content-Type": "application/json"
    }
    payload = {
        "topic": "realtime:aligned_states",
        "event": "new_state",
        "payload": state
    }
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=5)
        logger.info(f"Broadcasted aligned state. Status: {res.status_code}")
    except Exception as e:
        logger.warning(f"Failed to send realtime broadcast: {e}")

class AlignmentCoordinator:
    def __init__(self, tenant_id: str = "default-tenant"):
        self.tenant_id = tenant_id
        self.client = OpenAI(base_url=OLLAMA_BASE_URL, api_key="local")

    async def align(self, query_context: str, agent_outputs: List[AgentOutput]) -> Dict[str, Any]:
        """Execute the 4-step alignment architecture workflow."""
        start_time = datetime.now(timezone.utc)
        
        # Step 1: Freshness Check (Rule-based)
        freshness_flags, stale_agents = self._check_freshness(agent_outputs)
        freshness_mismatch = freshness_flags.get("freshness_mismatch", False)

        # Step 2: Conflict Detection (LLM call via gemma3:4b)
        conflicts = await self._detect_conflicts(agent_outputs)

        # Step 3: Confidence Aggregation (Rule-based)
        aggregate_confidence = self._aggregate_confidence(
            agent_outputs, 
            conflicts, 
            freshness_mismatch, 
            len(stale_agents)
        )

        # Step 4: Produce and Persist Canonical Aligned State
        aligned_state = self._produce_and_persist_state(
            query_context, 
            agent_outputs, 
            conflicts, 
            freshness_flags, 
            aggregate_confidence
        )

        return aligned_state

    def _check_freshness(self, agent_outputs: List[AgentOutput]) -> Tuple[Dict[str, Any], List[str]]:
        """Compare each agent's fetched_at against source registry TTLs."""
        stale_agents = []
        fresh_agents = []
        freshness_details = {}

        for a in agent_outputs:
            # Get connector name based on agent_id
            connector_name = f"{a.agent_id.title()}Agent"
            
            # Default TTLs (as seeded)
            default_ttl = "2 minutes"
            if a.agent_id == "macro":
                default_ttl = "1 day"
            elif a.agent_id == "news":
                default_ttl = "15 minutes"
            elif a.agent_id == "feedstock":
                default_ttl = "5 minutes"
            
            # Fetch from DB if configured
            entry = get_source_registry_entry(connector_name, self.tenant_id)
            ttl_str = entry.get("freshness_ttl", default_ttl) if entry else default_ttl
            
            # Calculate age
            age = datetime.now(timezone.utc) - a.fetched_at
            ttl_delta = parse_interval(ttl_str)
            
            is_stale = age > ttl_delta
            if is_stale:
                a.freshness_status = "stale"
                stale_agents.append(a.agent_id)
            else:
                a.freshness_status = "fresh"
                fresh_agents.append(a.agent_id)
                
            freshness_details[a.agent_id] = {
                "age_seconds": round(age.total_seconds(), 1),
                "ttl_seconds": round(ttl_delta.total_seconds(), 1),
                "status": a.freshness_status
            }

        # Freshness mismatch occurs if we have a mix of fresh and stale agents on the same run
        freshness_mismatch = len(stale_agents) > 0 and len(fresh_agents) > 0

        freshness_flags = {
            "freshness_mismatch": freshness_mismatch,
            "stale_agents": stale_agents,
            "details": freshness_details
        }
        
        return freshness_flags, stale_agents

    async def _detect_conflicts(self, agent_outputs: List[AgentOutput]) -> List[Dict[str, Any]]:
        """Identify contradictions and gaps using a single LLM call to gemma3:4b at temp 0.0."""
        if not agent_outputs:
            return []

        # Formulate active agent text details
        agent_data_str = ""
        for a in agent_outputs:
            agent_data_str += f"--- AGENT: {a.agent_id} (confidence: {a.confidence}) ---\n{a.raw_text}\n\n"

        prompt = f"""You are the Alignment Coordinator Agent for a petrochemical market intelligence platform.
Your task is to analyze the data fetched by multiple agents and identify any contradictions, leading indicator gaps, or directional mismatches.

Input agent data:
{agent_data_str}

Select only actual conflicts or inconsistencies in the data. For each conflict, categorize it as:
1. "contradiction" (e.g. one agent says price went up, another says it went down)
2. "leading_indicator" (e.g. crude price spikes, but downstream feedstock pricing doesn't reflect it yet)
3. "directional_mismatch" (e.g. macro indicators suggest high demand, but spot chemical prices are falling)

For the resolution, provide a clear annotation on how this conflict is tracked or expected to resolve (e.g. "Annotated: Cost pressure will flow through in 2-3 weeks"). Never silently resolve it.

Output a strict JSON object with a "conflicts" key containing a list of conflict records. Do not output any explanations outside the JSON.

Expected Output Format:
{{
  "conflicts": [
    {{
      "agents": ["commodity", "feedstock"],
      "type": "leading_indicator",
      "description": "WTI crude is up 2.95%, but MDI feedstock price map notes a 2-3 week propagation delay.",
      "resolution": "Annotated: Crude price spike will pressure aniline margins in 2-3 weeks."
    }}
  ]
}}
"""
        try:
            completion = self.client.chat.completions.create(
                model=OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": "You are a precise data alignment coordinator. You output ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0,
                response_format={"type": "json_object"}
            )
            raw = completion.choices[0].message.content
        except Exception as e:
            if "not found" in str(e).lower() and OLLAMA_MODEL != "gemma2:2b":
                logger.warning(f"Model '{OLLAMA_MODEL}' not found. Falling back to 'gemma2:2b' for conflict detection...")
                try:
                    completion = self.client.chat.completions.create(
                        model="gemma2:2b",
                        messages=[
                            {"role": "system", "content": "You are a precise data alignment coordinator. You output ONLY valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.0,
                        response_format={"type": "json_object"}
                    )
                    raw = completion.choices[0].message.content
                except Exception as fallback_e:
                    logger.warning(f"Fallback conflict detection also failed: {fallback_e}")
                    return []
            else:
                logger.warning(f"Conflict detection LLM call failed: {e}. Falling back to empty list.")
                return []

        try:
            parsed = json.loads(raw)
            return parsed.get("conflicts", [])
        except Exception as parse_e:
            logger.warning(f"Failed to parse conflict output as JSON: {parse_e}. Output: {raw}")
            return []

    def _aggregate_confidence(
        self, 
        agent_outputs: List[AgentOutput], 
        conflicts: List[Dict[str, Any]], 
        freshness_mismatch: bool, 
        stale_count: int
    ) -> float:
        """Compute the weighted average of agent confidences with penalties."""
        if not agent_outputs:
            return 1.0

        # Simple average of active agents
        base_confidence = sum(a.confidence for a in agent_outputs) / len(agent_outputs)

        # Conflict penalty: -0.1 per conflict
        conflict_penalty = 0.1 * len(conflicts)

        # Mismatch penalty: -0.05 per stale agent
        mismatch_penalty = 0.0
        if freshness_mismatch:
            mismatch_penalty = 0.05 * stale_count

        aggregate = base_confidence - conflict_penalty - mismatch_penalty
        return round(max(0.0, min(1.0, aggregate)), 3)

    def _produce_and_persist_state(
        self, 
        query_context: str, 
        agent_outputs: List[AgentOutput], 
        conflicts: List[Dict[str, Any]], 
        freshness_flags: Dict[str, Any], 
        aggregate_confidence: float
    ) -> Dict[str, Any]:
        """Assemble the CanonicalAlignedState, hash it, write to Supabase, and broadcast to Realtime."""
        
        # Format serialized agents list
        serialized_agents = []
        for a in agent_outputs:
            serialized_agents.append({
                "agent_id": a.agent_id,
                "domain": a.domain,
                "source": a.source,
                "fetched_at": a.fetched_at.isoformat() if isinstance(a.fetched_at, datetime) else a.fetched_at,
                "freshness_status": a.freshness_status,
                "confidence": a.confidence,
                "data": a.data
            })

        # Generate deduplication state hash
        hash_payload = json.dumps({
            "agents": sorted(serialized_agents, key=lambda x: x["agent_id"]),
            "conflicts": sorted(conflicts, key=lambda x: x.get("description", ""))
        }, sort_keys=True)
        state_hash = hashlib.sha256(hash_payload.encode('utf-8')).hexdigest()

        # Fetch latest version number and increment
        version = get_latest_version(query_context, self.tenant_id) + 1

        aligned_state = {
            "tenant_id": self.tenant_id,
            "version": version,
            "query_context": query_context,
            "agents": serialized_agents,
            "conflicts": conflicts,
            "aggregate_confidence": aggregate_confidence,
            "freshness_flags": freshness_flags,
            "state_hash": state_hash
        }

        # Write to Supabase
        db_record = insert_aligned_state(aligned_state)
        
        # Broadcast via Realtime HTTP API if successfully inserted
        if db_record:
            broadcast_realtime_event(db_record)
            return db_record
            
        # Return state dictionary locally even if DB call failed
        aligned_state["id"] = "local-session-only"
        aligned_state["aligned_at"] = datetime.now(timezone.utc).isoformat()
        return aligned_state
