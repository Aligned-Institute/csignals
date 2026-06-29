from datetime import datetime, timezone
import logging
from .base import BaseAgent, AgentOutput
from ..db import get_source_registry_entry

logger = logging.getLogger(__name__)

class CommodityAgent(BaseAgent):
    async def fetch(self) -> AgentOutput:
        # Load monday_brief dynamically to prevent import issues at module load
        import monday_brief
        
        default_confidence = 0.95
        # Fetch overridden confidence from DB if exists
        entry = get_source_registry_entry("CommodityAgent", self.tenant_id)
        confidence = entry.get("confidence", default_confidence) if entry else default_confidence
        
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
            
            raw_text = "### Live Commodity & Equity Prices (MCP):\n" + "\n".join(commodity_lines)
            return AgentOutput(
                agent_id="commodity",
                domain="commodity",
                source="yfinance_commodity",
                fetched_at=datetime.now(timezone.utc),
                freshness_status="fresh",
                confidence=confidence,
                data=market_data,
                raw_text=raw_text
            )
        except Exception as e:
            logger.error(f"CommodityAgent fetch failed: {e}")
            return AgentOutput(
                agent_id="commodity",
                domain="commodity",
                source="yfinance_commodity",
                fetched_at=datetime.now(timezone.utc),
                freshness_status="stale",
                confidence=0.0,
                data={"error": str(e)},
                raw_text=f"### Live Commodity Prices (MCP):\nUnavailable due to error: {e}"
            )
