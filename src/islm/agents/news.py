from datetime import datetime, timezone
import logging
from .base import BaseAgent, AgentOutput
from ..db import get_source_registry_entry

logger = logging.getLogger(__name__)

class NewsAgent(BaseAgent):
    async def fetch(self) -> AgentOutput:
        import monday_brief
        
        default_confidence = 0.80
        entry = get_source_registry_entry("NewsAgent", self.tenant_id)
        confidence = entry.get("confidence", default_confidence) if entry else default_confidence
        
        try:
            news_feeds = monday_brief.fetch_news()
            news_lines = []
            for item in news_feeds:
                news_lines.append(f"- [{item['source']}] {item['headline']}")
            
            raw_text = "### Industry News Headlines (MCP):\n" + "\n".join(news_lines)
            return AgentOutput(
                agent_id="news",
                domain="news",
                source="rss_news",
                fetched_at=datetime.now(timezone.utc),
                freshness_status="fresh",
                confidence=confidence,
                data={"news": news_feeds},
                raw_text=raw_text
            )
        except Exception as e:
            logger.error(f"NewsAgent fetch failed: {e}")
            return AgentOutput(
                agent_id="news",
                domain="news",
                source="rss_news",
                fetched_at=datetime.now(timezone.utc),
                freshness_status="stale",
                confidence=0.0,
                data={"error": str(e)},
                raw_text=f"### Industry News Headlines (MCP):\nUnavailable due to error: {e}"
            )
