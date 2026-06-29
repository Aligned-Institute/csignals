from datetime import datetime, timezone
import logging
from .base import BaseAgent, AgentOutput
from ..db import get_source_registry_entry

logger = logging.getLogger(__name__)

class FeedstockAgent(BaseAgent):
    async def fetch(self) -> AgentOutput:
        default_confidence = 0.85
        entry = get_source_registry_entry("FeedstockAgent", self.tenant_id)
        confidence = entry.get("confidence", default_confidence) if entry else default_confidence
        
        raw_text = (
            "### Feedstock Value Chain Formula Notes (MCP):\n"
            "- Structural cost flow: WTI Crude → Naphtha → Benzene → Aniline → MDI.\n"
            "- Natural Gas acts as primary plant utility energy cost driver.\n"
            "- A 10% sustained increase in WTI Crude prices historically feeds through to Aniline contract costs within 2 to 3 weeks."
        )
        
        return AgentOutput(
            agent_id="feedstock",
            domain="domain",
            source="feedstock_chain",
            fetched_at=datetime.now(timezone.utc),
            freshness_status="fresh",
            confidence=confidence,
            data={
                "value_chain": ["crude", "naphtha", "benzene", "aniline", "mdi"],
                "notes": "Natural gas adds ~15% to production energy cost."
            },
            raw_text=raw_text
        )
