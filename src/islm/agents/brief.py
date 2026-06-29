from datetime import datetime, timezone
from pathlib import Path
import logging
from .base import BaseAgent, AgentOutput
from ..db import get_source_registry_entry

logger = logging.getLogger(__name__)

class BriefAgent(BaseAgent):
    async def fetch(self) -> AgentOutput:
        default_confidence = 0.90
        entry = get_source_registry_entry("BriefAgent", self.tenant_id)
        confidence = entry.get("confidence", default_confidence) if entry else default_confidence
        
        try:
            # Resolve PROJECT_ROOT relative to this file
            PROJECT_ROOT = Path(__file__).parent.parent.parent.parent.resolve()
            output_dir = PROJECT_ROOT / "output"
            brief_files = sorted(output_dir.glob("brief_*.md"), reverse=True)
            if brief_files:
                latest_brief = brief_files[0]
                brief_content = latest_brief.read_text(encoding="utf-8", errors="ignore")
                summary = brief_content[:2000] + "\n... [Content Truncated] ..." if len(brief_content) > 2000 else brief_content
                raw_text = f"### Latest Weekly Market Brief Summary ({latest_brief.name}) (MCP):\n{summary}"
                data = {"filename": latest_brief.name, "content_sample": summary}
            else:
                raw_text = "### Brief Archive (MCP):\nNo past briefs generated yet."
                data = {}
            
            return AgentOutput(
                agent_id="brief",
                domain="news",
                source="brief_archive",
                fetched_at=datetime.now(timezone.utc),
                freshness_status="fresh",
                confidence=confidence,
                data=data,
                raw_text=raw_text
            )
        except Exception as e:
            logger.error(f"BriefAgent fetch failed: {e}")
            return AgentOutput(
                agent_id="brief",
                domain="news",
                source="brief_archive",
                fetched_at=datetime.now(timezone.utc),
                freshness_status="stale",
                confidence=0.0,
                data={"error": str(e)},
                raw_text=f"### Brief Archive (MCP):\nUnavailable due to error: {e}"
            )
        
        
