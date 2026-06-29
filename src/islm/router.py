import json
import time
import logging
from openai import OpenAI
from .schemas import RoutingDecision, RouterRequest, RouterResponse
from .config import (
    OLLAMA_BASE_URL, OLLAMA_MODEL, CONFIDENCE_THRESHOLD,
    AVAILABLE_AGENTS, SYSTEM_PROMPT
)

logger = logging.getLogger(__name__)

client = OpenAI(base_url=OLLAMA_BASE_URL, api_key="local")


def route(request: RouterRequest) -> RouterResponse:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    user_content = request.query
    if request.context:
        user_content = f"Context: {request.context}\n\nQuery: {request.query}"

    messages.append({"role": "user", "content": user_content})

    start = time.monotonic()

    try:
        completion = client.chat.completions.create(
            model=OLLAMA_MODEL,
            messages=messages,
            temperature=0.0,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content
    except Exception as e:
        if "not found" in str(e).lower() and OLLAMA_MODEL != "gemma2:2b":
            logger.warning(f"Model '{OLLAMA_MODEL}' not found. Falling back to 'gemma2:2b' for routing classification...")
            try:
                completion = client.chat.completions.create(
                    model="gemma2:2b",
                    messages=messages,
                    temperature=0.0,
                    response_format={"type": "json_object"},
                )
                raw = completion.choices[0].message.content
            except Exception as fallback_e:
                logger.error(f"Fallback model 'gemma2:2b' also failed: {fallback_e}")
                raise
        else:
            logger.error(f"Ollama call failed: {e}")
            raise

    latency_ms = (time.monotonic() - start) * 1000

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse failed. Raw output: {raw}")
        raise ValueError(f"iSLM returned invalid JSON: {e}") from e

    # Sanitize agents — only allow known values
    agents = [a for a in parsed.get("agents", []) if a in AVAILABLE_AGENTS]

    # Confidence fallback: escalate to hybrid if below threshold
    confidence = float(parsed.get("confidence", 0.5))
    route_val = parsed.get("route", "hybrid")
    if confidence < CONFIDENCE_THRESHOLD and route_val not in ("hybrid", "direct"):
        logger.warning(
            f"Low confidence ({confidence:.2f}) on route '{route_val}' — escalating to hybrid"
        )
        route_val = "hybrid"

    decision = RoutingDecision(
        route=route_val,
        agents=agents,
        rag_query=parsed.get("rag_query"),
        mcp_params=parsed.get("mcp_params"),
        reasoning=parsed.get("reasoning", ""),
        confidence=confidence,
    )

    logger.info(
        f"ROUTE [{decision.route.upper()}] | agents={decision.agents} | "
        f"confidence={decision.confidence:.2f} | latency={latency_ms:.0f}ms | "
        f"query='{request.query[:80]}'"
    )

    return RouterResponse(
        decision=decision,
        model=OLLAMA_MODEL,
        latency_ms=round(latency_ms, 1),
    )
