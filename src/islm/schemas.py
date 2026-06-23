from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field


class RoutingDecision(BaseModel):
    route: Literal["rag", "mcp", "hybrid", "direct"] = Field(
        description=(
            "Select 'rag' for questions answerable from static docs (filings, notes, methodology). "
            "'mcp' for live data needs (prices, macro, news, feedstock status). "
            "'hybrid' when both static context AND live data are required. "
            "'direct' only when the model can answer safely without any external data."
        )
    )
    agents: List[str] = Field(
        default=[],
        description=(
            "For 'mcp' or 'hybrid' routes, list the agent(s) to call. "
            "Valid values: 'commodity', 'macro', 'news', 'feedstock', 'brief', 'analyzer'. "
            "Include all agents whose data is needed to answer the query."
        )
    )
    rag_query: Optional[str] = Field(
        None,
        description="For 'rag' or 'hybrid' routes, the search string to send to the vector database."
    )
    mcp_params: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional parameters to pass to the selected MCP agents."
    )
    reasoning: str = Field(
        description="One sentence: why this route was chosen for this query."
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Routing confidence 0.0–1.0. Below 0.6 triggers fallback to 'hybrid'."
    )


class RouterRequest(BaseModel):
    query: str
    context: Optional[str] = None  # optional prior conversation context
    token: Optional[str] = None    # optional user JWT session token for RLS query isolation
    model: Optional[str] = None    # optional dynamic model selector (Internal, External1, External2)


class RouterResponse(BaseModel):
    decision: RoutingDecision
    model: str
    latency_ms: float


class SourceDocument(BaseModel):
    name: str
    text: str
    score: float


class QueryResponse(BaseModel):
    answer: str
    routing_decision: RoutingDecision
    thinking: Optional[str] = None
    sources: List[SourceDocument] = []
    latency_ms: float

