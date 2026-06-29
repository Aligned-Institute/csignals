from datetime import datetime, timezone
import logging
from .base import BaseAgent, AgentOutput
from ..db import get_source_registry_entry

logger = logging.getLogger(__name__)

class MacroAgent(BaseAgent):
    async def fetch(self) -> AgentOutput:
        import monday_brief
        
        default_confidence = 0.90
        entry = get_source_registry_entry("MacroAgent", self.tenant_id)
        confidence = entry.get("confidence", default_confidence) if entry else default_confidence
        
        try:
            macro_data = monday_brief.fetch_macro_data()
            macro_lines = []
            if macro_data:
                for name, d in macro_data.items():
                    macro_lines.append(
                        f"- {d['label']}: {d['value']} (Date: {d['date']}, MoM/QoQ change: {d.get('change_pct', 0.0)}%)"
                    )
                raw_text = "### FRED Macroeconomic Indicators (MCP):\n" + "\n".join(macro_lines)
            else:
                macro_data = {}
                raw_text = "### FRED Macroeconomic Indicators (MCP):\nFRED key not configured or no series loaded."
            
            return AgentOutput(
                agent_id="macro",
                domain="macro",
                source="fred_macro",
                fetched_at=datetime.now(timezone.utc),
                freshness_status="fresh",
                confidence=confidence,
                data=macro_data,
                raw_text=raw_text
            )
        except Exception as e:
            logger.error(f"MacroAgent fetch failed: {e}")
            return AgentOutput(
                agent_id="macro",
                domain="macro",
                source="fred_macro",
                fetched_at=datetime.now(timezone.utc),
                freshness_status="stale",
                confidence=0.0,
                data={"error": str(e)},
                raw_text=f"### FRED Macroeconomic Indicators (MCP):\nUnavailable due to error: {e}"
            )
