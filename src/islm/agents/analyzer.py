from datetime import datetime, timezone
import logging
from .base import BaseAgent, AgentOutput
from ..db import get_source_registry_entry

logger = logging.getLogger(__name__)

class AnalyzerAgent(BaseAgent):
    async def fetch(self) -> AgentOutput:
        default_confidence = 0.90
        entry = get_source_registry_entry("AnalyzerAgent", self.tenant_id)
        confidence = entry.get("confidence", default_confidence) if entry else default_confidence
        
        raw_text = "### Data Analyzer Context (MCP):\nUser uploaded files are analyzed against live market contexts. (No files uploaded in active conversation thread)."
        
        return AgentOutput(
            agent_id="analyzer",
            domain="upload",
            source="upload_analyzer",
            fetched_at=datetime.now(timezone.utc),
            freshness_status="fresh",
            confidence=confidence,
            data={},
            raw_text=raw_text
        )
