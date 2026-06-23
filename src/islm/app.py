import logging
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import RouterRequest, RouterResponse, QueryResponse
from .router import route
from .executor import execute_query
from .config import ISLM_HOST, ISLM_PORT

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(title="Signals iSLM Router", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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


if __name__ == "__main__":
    uvicorn.run("src.islm.app:app", host=ISLM_HOST, port=ISLM_PORT, reload=True)

