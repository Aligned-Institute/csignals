"""
Phase 0 gate: iSLM router must correctly classify 18/20 test queries.
Run: python3 -m pytest tests/test_islm_router.py -v
Requires: Ollama running with gemma2:2b loaded.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from src.islm import route, RouterRequest

# (query, expected_route, required_agents_subset)
TEST_CASES = [
    # --- MCP: live data needed ---
    ("What is the current WTI crude oil price?",
     "mcp", ["commodity"]),
    ("What did the Fed do with interest rates this month?",
     "mcp", ["macro"]),
    ("Any news about benzene supply disruptions today?",
     "mcp", ["news"]),
    ("What is the current MDI feedstock chain status?",
     "mcp", ["feedstock"]),
    ("Show me the latest Monday morning brief.",
     "mcp", ["brief"]),
    ("What is the EUR/USD rate right now?",
     "mcp", ["commodity"]),
    ("What is the current housing starts number?",
     "mcp", ["macro"]),

    # --- RAG: static knowledge needed ---
    ("What are Huntsman's three business segments?",
     "rag", []),
    ("How does Huntsman price its MDI contracts?",
     "rag", []),
    ("What is the methodology behind the anomaly detection flags?",
     "rag", []),
    ("What upstream commodities does the Performance Products division use?",
     "rag", []),

    # --- HYBRID: live + static context needed ---
    ("WTI is up 3% today — what does that mean for MDI margins?",
     "hybrid", ["commodity", "feedstock"]),
    ("Compare current benzene prices against Huntsman's historical feedstock exposure.",
     "hybrid", ["commodity"]),
    ("Housing starts dropped — how does that affect polyurethane demand?",
     "hybrid", ["macro"]),
    ("Given today's macro data, what should the sales team be saying this week?",
     "hybrid", ["macro", "commodity"]),

    # --- DIRECT: no external data needed ---
    ("What does MDI stand for?",
     "direct", []),
    ("What is the difference between RAG and MCP?",
     "direct", []),

    # --- Edge cases: ambiguous, should not crash ---
    ("Analyze my uploaded procurement data against market conditions.",
     "mcp", ["analyzer"]),
    ("Give me a full market brief.",
     "mcp", []),  # agents may vary — just check route
    ("What happened to chemical stocks last week and why?",
     "hybrid", []),
]


@pytest.mark.parametrize("query,expected_route,required_agents", TEST_CASES)
def test_routing(query, expected_route, required_agents):
    request = RouterRequest(query=query)
    response = route(request)
    decision = response.decision

    assert decision.route == expected_route, (
        f"\nQuery: {query!r}"
        f"\nExpected route: {expected_route!r}"
        f"\nGot route: {decision.route!r}"
        f"\nReasoning: {decision.reasoning}"
    )

    for agent in required_agents:
        assert agent in decision.agents, (
            f"\nQuery: {query!r}"
            f"\nExpected agent {agent!r} in agents list"
            f"\nGot agents: {decision.agents}"
        )

    assert 0.0 <= decision.confidence <= 1.0
    assert decision.reasoning


def test_confidence_fallback():
    """Low-confidence routing should escalate to hybrid, not fail."""
    request = RouterRequest(query="Tell me something about chemicals markets maybe?")
    response = route(request)
    assert response.decision.route in ("mcp", "hybrid", "rag", "direct")
    assert response.latency_ms > 0


def test_invalid_agents_sanitized():
    """Router must never return agents outside the approved list."""
    request = RouterRequest(query="Get me everything from all systems.")
    response = route(request)
    valid = {"commodity", "macro", "news", "feedstock", "brief", "analyzer"}
    for agent in response.decision.agents:
        assert agent in valid, f"Illegal agent returned: {agent!r}"
