from dataclasses import dataclass
from datetime import datetime
from abc import ABC, abstractmethod

@dataclass
class AgentOutput:
    agent_id: str
    domain: str          # commodity | macro | news | domain | upload
    source: str
    fetched_at: datetime
    freshness_status: str  # fresh | warning | stale
    confidence: float      # 0.0–1.0
    data: dict
    raw_text: str

class BaseAgent(ABC):
    def __init__(self, tenant_id: str = "default-tenant"):
        self.tenant_id = tenant_id

    @abstractmethod
    async def fetch(self) -> AgentOutput:
        pass
