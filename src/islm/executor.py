#!/usr/bin/env python3
"""
iSLM Query Executor
Handles classification, RAG retrieval (cosine similarity),
MCP agent data collection, and DeepSeek-R1 response synthesis.
"""

import os
import re
import json
import time
import logging
import requests
import sys
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from openai import OpenAI

from .schemas import QueryResponse, SourceDocument, RoutingDecision, RouterRequest
from .router import route as route_query
from .config import OLLAMA_BASE_URL, OLLAMA_MODEL, EMBED_MODEL, OLLAMA_EMBED_URL, SYNTHESIS_MODEL
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Setup Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()
load_dotenv(PROJECT_ROOT / "config" / ".env")

RAG_STORE_PATH = Path(__file__).parent / "rag_store.json"
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Check if Supabase keys are valid (not blank or placeholders)
IS_SUPABASE_CONFIGURED = (
    SUPABASE_URL 
    and SUPABASE_KEY 
    and not SUPABASE_URL.startswith("https://your-")
    and "SECRET" not in SUPABASE_KEY
)

def is_valid_key(key: Optional[str]) -> bool:
    return bool(key and "YOUR_KEY" not in key and "your_" not in key and len(key.strip()) > 10)

# Load RAG store into memory on import for offline search fallback
RAG_STORE: List[Dict[str, Any]] = []
if RAG_STORE_PATH.exists():
    try:
        RAG_STORE = json.loads(RAG_STORE_PATH.read_text(encoding="utf-8"))
        logger.info(f"Loaded {len(RAG_STORE)} chunks from RAG store.")
    except Exception as e:
        logger.error(f"Failed to load RAG store: {e}")
else:
    logger.warning(f"RAG store not found at {RAG_STORE_PATH}. RAG search fallback will be unavailable.")


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(x * y for x, y in zip(v1, v2))
    magnitude1 = sum(x * x for x in v1) ** 0.5
    magnitude2 = sum(y * y for y in v2) ** 0.5
    if magnitude1 * magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)


def get_query_embedding(text: str) -> List[float]:
    """Fetch embedding vector for query string using nomic-embed-text."""
    try:
        response = requests.post(
            OLLAMA_EMBED_URL,
            json={"model": EMBED_MODEL, "prompt": text},
            timeout=10
        )
        if response.status_code == 200:
            return response.json().get("embedding", [])
        else:
            logger.error(f"Ollama Embeddings API returned status {response.status_code}")
            return []
    except Exception as e:
        logger.error(f"Failed to fetch embedding from Ollama: {e}")
        return []


def retrieve_rag_context(query: str, top_k: int = 3, token: Optional[str] = None) -> Tuple[str, List[SourceDocument]]:
    """Retrieve top-k relevant snippets from Supabase vector DB or fallback to local JSON store."""
    query_vector = get_query_embedding(query)
    if not query_vector:
        return "RAG retrieval failed (embedding generation error).", []

    # 1. Try Supabase query if configured
    if IS_SUPABASE_CONFIGURED:
        auth_header = f"Bearer {token}" if token else f"Bearer {SUPABASE_KEY}"
        logger.info(f"Querying Supabase vector database for RAG matches: '{query}' (RLS Token active: {token is not None})")
        endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/rpc/match_documents"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": auth_header,
            "Content-Type": "application/json"
        }
        body = {
            "query_embedding": query_vector,
            "match_threshold": 0.3,
            "match_count": top_k
        }
        try:
            r = requests.post(endpoint, json=body, headers=headers, timeout=10)
            if r.status_code == 200:
                results = r.json()
                sources = []
                context_parts = []
                for row in results:
                    doc_name = row.get("document", "Unknown Doc")
                    text = row.get("content", "")
                    score = float(row.get("score", 0.0))
                    context_parts.append(f"--- SOURCE: {doc_name} (Relevance Score: {score:.3f}) ---\n{text}\n")
                    sources.append(SourceDocument(name=doc_name, text=text, score=round(score, 3)))
                
                context_str = "\n".join(context_parts)
                logger.info(f"Retrieved {len(sources)} matches from Supabase pgvector.")
                return context_str, sources
            else:
                logger.error(f"Supabase RPC query failed with Status {r.status_code}: {r.text}. Falling back to local RAG.")
        except Exception as e:
            logger.error(f"Failed to query Supabase RPC: {e}. Falling back to local RAG.")

    # 2. Fallback to local offline RAG store
    if not RAG_STORE:
        return "No RAG documents indexed.", []

    scored_chunks = []
    for chunk in RAG_STORE:
        score = cosine_similarity(query_vector, chunk["embedding"])
        scored_chunks.append((score, chunk))

    # Sort descending by similarity score
    scored_chunks.sort(key=lambda x: x[0], reverse=True)

    top_matches = scored_chunks[:top_k]
    
    # Filter for minimum similarity threshold to avoid irrelevant noise
    relevant_matches = [m for m in top_matches if m[0] >= 0.3]
    if not relevant_matches:
        # Fallback to absolute best match if threshold is slightly too strict but we need context
        relevant_matches = top_matches[:1]

    sources = []
    context_parts = []
    for idx, (score, chunk) in enumerate(relevant_matches):
        doc_name = chunk.get("document", "Unknown Doc")
        text = chunk.get("text", "")
        context_parts.append(f"--- SOURCE: {doc_name} (Relevance Score: {score:.3f}) ---\n{text}\n")
        sources.append(SourceDocument(name=doc_name, text=text, score=round(score, 3)))

    context_str = "\n".join(context_parts)
    return context_str, sources


def retrieve_mcp_context(agents: List[str]) -> str:
    """Retrieve live market indicators and industry news using the monday_brief logic."""
    # Ensure scripts directory is in path
    scripts_dir = str(PROJECT_ROOT / "scripts")
    if scripts_dir not in sys.path:
        sys.path.append(scripts_dir)

    try:
        import monday_brief
    except ImportError as e:
        logger.error(f"Failed to import monday_brief script: {e}")
        return "MCP Retrieval Error: could not load data gathering helpers."

    context_blocks = []

    # 1. Commodity prices
    if "commodity" in agents or "feedstock" in agents:
        try:
            market_data = monday_brief.fetch_market_data()
            commodity_lines = []
            for name, d in market_data.items():
                if "price" in d:
                    commodity_lines.append(
                        f"- {name.replace('_', ' ').title()}: ${d['price']} "
                        f"(1d change: {d.get('change_1d_pct', 0.0)}%, 5d change: {d.get('change_5d_pct', 0.0)}%)"
                    )
                else:
                    commodity_lines.append(f"- {name.replace('_', ' ').title()}: Error loading ({d.get('error', 'unknown')})")
            context_blocks.append("### Live Commodity & Equity Prices (MCP):\n" + "\n".join(commodity_lines))
        except Exception as e:
            logger.error(f"Failed fetching MCP commodities: {e}")
            context_blocks.append("### Live Commodity Prices (MCP):\nUnavailable due to collection error.")

    # 2. Macro indicators
    if "macro" in agents:
        try:
            macro_data = monday_brief.fetch_macro_data()
            macro_lines = []
            if macro_data:
                for name, d in macro_data.items():
                    macro_lines.append(
                        f"- {d['label']}: {d['value']} (Date: {d['date']}, MoM/QoQ change: {d.get('change_pct', 0.0)}%)"
                    )
                context_blocks.append("### FRED Macroeconomic Indicators (MCP):\n" + "\n".join(macro_lines))
            else:
                context_blocks.append("### FRED Macroeconomic Indicators (MCP):\nFRED key not configured or no series loaded.")
        except Exception as e:
            logger.error(f"Failed fetching MCP macro indicators: {e}")

    # 3. News RSS feeds
    if "news" in agents:
        try:
            news_feeds = monday_brief.fetch_news()
            news_lines = []
            for item in news_feeds:
                news_lines.append(f"- [{item['source']}] {item['headline']}")
            context_blocks.append("### Industry News Headlines (MCP):\n" + "\n".join(news_lines))
        except Exception as e:
            logger.error(f"Failed fetching MCP news: {e}")

    # 4. Feedstock Cost Chain analysis
    if "feedstock" in agents:
        # Construct margin calculation notes
        context_blocks.append(
            "### Feedstock Value Chain Formula Notes (MCP):\n"
            "- Structural cost flow: WTI Crude → Naphtha → Benzene → Aniline → MDI.\n"
            "- Natural Gas acts as primary plant utility energy cost driver.\n"
            "- A 10% sustained increase in WTI Crude prices historically feeds through to Aniline contract costs within 2 to 3 weeks."
        )

    # 5. Brief archive lookup
    if "brief" in agents:
        try:
            output_dir = PROJECT_ROOT / "output"
            brief_files = sorted(output_dir.glob("brief_*.md"), reverse=True)
            if brief_files:
                latest_brief = brief_files[0]
                brief_content = latest_brief.read_text(encoding="utf-8", errors="ignore")
                # Truncate content to keep prompt size reasonable
                summary = brief_content[:2000] + "\n... [Content Truncated] ..." if len(brief_content) > 2000 else brief_content
                context_blocks.append(f"### Latest Weekly Market Brief Summary ({latest_brief.name}) (MCP):\n{summary}")
            else:
                context_blocks.append("### Brief Archive (MCP):\nNo past briefs generated yet.")
        except Exception as e:
            logger.error(f"Failed retrieving brief archive: {e}")

    # 6. Upload analyzer
    if "analyzer" in agents:
        context_blocks.append("### Data Analyzer Context (MCP):\nUser uploaded files are analyzed against live market contexts. (No files uploaded in active conversation thread).")

    return "\n\n".join(context_blocks)


def execute_query(request: RouterRequest) -> QueryResponse:
    """Classify routing decision, retrieve context, synthesize response via deepseek-r1:8b."""
    start_time = time.monotonic()

    # 1. Call router to classify query
    router_resp = route_query(request)
    decision: RoutingDecision = router_resp.decision

    # 2. Retrieve context based on route
    context_str = ""
    sources = []

    if decision.route in ("rag", "hybrid"):
        rag_query = decision.rag_query or request.query
        logger.info(f"Executing RAG retrieval for query: '{rag_query}'")
        rag_context, sources = retrieve_rag_context(rag_query, token=request.token)
        context_str += f"## RAG Corporate Intelligence Context:\n{rag_context}\n\n"

    if decision.route in ("mcp", "hybrid") and decision.agents:
        logger.info(f"Executing MCP retrieval for agents: {decision.agents}")
        mcp_context = retrieve_mcp_context(decision.agents)
        context_str += f"## Live Market & News Context (MCP):\n{mcp_context}\n\n"

    # 3. Build synthesis prompt
    context_block = context_str.strip() if context_str else ""
    if request.context:
        context_block = f"### User Uploaded File Data Context:\n{request.context}\n\n{context_block}"
        
    if not context_block.strip():
        context_block = "No external document or live data context retrieved."
        
    prompt = f"""You are Sage, the Aligned Sovereign Intelligence enterprise market intelligence system for ChemSignals.
Your job is to answer the user's query using the retrieved company intelligence (RAG) and/or live market data (MCP) context provided below.

RULES:
1. Base your answer strictly on the retrieved context whenever possible.
2. If the context does not contain relevant information, rely on your core knowledge but state clearly that the answer is not in the private documents.
3. Be professional, direct, quantitative, and action-oriented.
4. Output your response in structured Markdown format. Cite specific files (e.g. `basf-report-2025.pdf`) when referring to facts from the RAG context.

Retrieved Context:
{context_block}

User Query:
{request.query}

Your Answer:"""

    # 4. Choose model based on request.model selector
    requested_model = request.model or "Internal"
    answer = ""
    thinking = ""

    # Load keys
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    has_anthropic = is_valid_key(anthropic_key)
    has_openai = is_valid_key(openai_key)

    if requested_model == "External1" and not has_anthropic:
        logger.warning("External 1 (Claude) requested but ANTHROPIC_API_KEY is not configured. Falling back to Internal iLLM.")
        requested_model = "Internal"
        
    elif requested_model == "External2" and not has_openai:
        logger.warning("External 2 (GPT-4o) requested but OPENAI_API_KEY is not configured. Falling back to Internal iLLM.")
        requested_model = "Internal"

    try:
        if requested_model == "External1":
            logger.info("Executing synthesis via Cloud External 1 (Claude 3.5 Sonnet)")
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key)
            completion = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
            )
            answer = completion.content[0].text
            thinking = "[Cloud Synthesis — Claude 3.5 Sonnet executing via Anthropic API]"
            
        elif requested_model == "External2":
            logger.info("Executing synthesis via Cloud External 2 (GPT-4o)")
            client = OpenAI(api_key=openai_key)
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
            )
            answer = completion.choices[0].message.content
            thinking = "[Cloud Synthesis — GPT-4o executing via OpenAI API]"
            
        else:
            logger.info(f"Executing synthesis via Internal iLLM ({SYNTHESIS_MODEL})")
            client = OpenAI(base_url=OLLAMA_BASE_URL, api_key="local")
            completion = client.chat.completions.create(
                model=SYNTHESIS_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
            )
            raw_content = completion.choices[0].message.content
            
            # Extract thinking process and clean up the answer
            think_match = re.search(r"<think>(.*?)</think>", raw_content, re.DOTALL)
            if think_match:
                thinking = think_match.group(1).strip()
                answer = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()
            else:
                answer = raw_content.strip()
                
    except Exception as e:
        logger.error(f"Synthesis failed for model {requested_model}: {e}")
        if requested_model != "Internal":
            logger.info("Cloud execution failed, falling back to Internal iLLM...")
            try:
                client = OpenAI(base_url=OLLAMA_BASE_URL, api_key="local")
                completion = client.chat.completions.create(
                    model=SYNTHESIS_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.6,
                )
                raw_content = completion.choices[0].message.content
                think_match = re.search(r"<think>(.*?)</think>", raw_content, re.DOTALL)
                if think_match:
                    thinking = think_match.group(1).strip()
                    answer = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()
                else:
                    answer = raw_content.strip()
            except Exception as inner_e:
                answer = f"Error during local fallback synthesis: {inner_e}. Original error: {e}"
        else:
            answer = f"Error during response synthesis: {e}. Ensure Ollama is running with model {SYNTHESIS_MODEL}."

    latency_ms = (time.monotonic() - start_time) * 1000
    
    return QueryResponse(
        answer=answer,
        routing_decision=decision,
        thinking=thinking if thinking else None,
        sources=sources,
        latency_ms=round(latency_ms, 1)
    )
