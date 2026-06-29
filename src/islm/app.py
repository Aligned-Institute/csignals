import logging
import uvicorn
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from .schemas import RouterRequest, RouterResponse, QueryResponse
from .router import route
from .executor import execute_query, get_tenant_id_from_token
from .config import ISLM_HOST, ISLM_PORT

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(title="Signals iSLM Router", version="0.2.5")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_tenant_from_auth(authorization: Optional[str] = Header(None), token: Optional[str] = None) -> str:
    """Helper to extract tenant_id from either Authorization Header or query token."""
    jwt_token = token
    if not jwt_token and authorization and authorization.startswith("Bearer "):
        jwt_token = authorization.split(" ")[1]
    return get_tenant_id_from_token(jwt_token)


@app.get("/health")
def health():
    return {"status": "ok", "service": "islm-router"}


@app.post("/route", response_model=RouterResponse)
def route_query(request: RouterRequest):
    try:
        return route(request)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Router unavailable: {e}")


@app.post("/query", response_model=QueryResponse)
def run_query(request: RouterRequest):
    try:
        return execute_query(request)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Query execution failed: {e}")


@app.post("/align")
async def run_alignment(request: RouterRequest):
    """Run parallel agents and Alignment Coordinator without doing answer synthesis."""
    try:
        router_resp = route(request)
        decision = router_resp.decision
        tenant_id = get_tenant_id_from_token(request.token)
        
        from .agents import CommodityAgent, MacroAgent, NewsAgent, FeedstockAgent, BriefAgent, AnalyzerAgent
        from .alignment import AlignmentCoordinator
        
        agent_map = {
            "commodity": CommodityAgent,
            "macro": MacroAgent,
            "news": NewsAgent,
            "feedstock": FeedstockAgent,
            "brief": BriefAgent,
            "analyzer": AnalyzerAgent
        }
        
        active_agents = []
        for name in decision.agents:
            if name in agent_map:
                active_agents.append(agent_map[name](tenant_id=tenant_id))
                
        if not active_agents:
            return {
                "tenant_id": tenant_id,
                "version": 1,
                "query_context": request.query,
                "agents": [],
                "conflicts": [],
                "aggregate_confidence": 1.0,
                "freshness_flags": {"freshness_mismatch": False, "stale_agents": [], "details": {}},
                "state_hash": "",
                "id": "empty-alignment"
            }
            
        agent_outputs = await asyncio.gather(*[a.fetch() for a in active_agents])
        coordinator = AlignmentCoordinator(tenant_id=tenant_id)
        aligned_state = await coordinator.align(request.query, list(agent_outputs))
        return aligned_state
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Alignment failed: {e}")


@app.get("/state/latest")
def get_latest_state(authorization: Optional[str] = Header(None), token: Optional[str] = None):
    """Fetch the latest aligned state for the current authenticated tenant."""
    try:
        tenant_id = get_tenant_from_auth(authorization, token)
        from .db import get_latest_aligned_state
        state = get_latest_aligned_state(tenant_id)
        if not state:
            raise HTTPException(status_code=404, detail="No aligned states found for this tenant.")
        return state
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/state/history")
def get_state_history(authorization: Optional[str] = Header(None), token: Optional[str] = None, limit: int = 10):
    """Fetch recent aligned state history for the tenant."""
    try:
        tenant_id = get_tenant_from_auth(authorization, token)
        from .db import get_version_history
        return get_version_history(tenant_id, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/state/{id}")
def get_state_by_id(id: str, authorization: Optional[str] = Header(None), token: Optional[str] = None):
    """Fetch a specific aligned state by ID for the current authenticated tenant."""
    try:
        tenant_id = get_tenant_from_auth(authorization, token)
        from .db import get_aligned_state_by_id
        state = get_aligned_state_by_id(id, tenant_id)
        if not state:
            raise HTTPException(status_code=404, detail=f"Aligned state {id} not found.")
        return state
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sources")
def get_sources(authorization: Optional[str] = Header(None), token: Optional[str] = None):
    """List registered data sources and their configurations for the current authenticated tenant."""
    try:
        tenant_id = get_tenant_from_auth(authorization, token)
        from .db import get_all_sources
        return get_all_sources(tenant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("src.islm.app:app", host=ISLM_HOST, port=ISLM_PORT, reload=True)
