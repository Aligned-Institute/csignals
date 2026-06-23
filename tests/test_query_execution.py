"""
Tests for iSLM Query Execution & Retrieval (RAG + MCP)
Run: .venv/bin/pytest tests/test_query_execution.py -v
Requires: Ollama running with gemma2:2b, deepseek-r1:8b, and nomic-embed-text loaded.
"""

import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))

import pytest
from src.islm import RouterRequest
from src.islm.executor import cosine_similarity, retrieve_rag_context, retrieve_mcp_context, execute_query


def test_cosine_similarity():
    # Exact match
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    assert abs(cosine_similarity(v1, v2) - 1.0) < 1e-6

    # Orthogonal
    v3 = [0.0, 1.0, 0.0]
    assert abs(cosine_similarity(v1, v3) - 0.0) < 1e-6

    # Opposite
    v4 = [-1.0, 0.0, 0.0]
    assert abs(cosine_similarity(v1, v4) - (-1.0)) < 1e-6

    # Mismatched dimensions
    assert cosine_similarity([1.0], [1.0, 2.0]) == 0.0


def test_rag_retrieval():
    # Check that we can retrieve files. Since rag_store.json has real content,
    # searching for "Huntsman MDI" should return documents.
    context, sources = retrieve_rag_context("Huntsman MDI pricing methodology", top_k=2)
    assert len(sources) > 0
    assert sources[0].name
    assert sources[0].text
    assert sources[0].score > 0.0
    assert "SOURCE:" in context


def test_mcp_retrieval():
    # Verify that MCP agents compile live metrics successfully
    context = retrieve_mcp_context(["commodity", "macro", "news"])
    assert "Commodity" in context
    assert "News" in context
    # Macro might be missing if FRED API key is not configured, but should not fail
    assert len(context) > 20


def test_end_to_end_execute_query():
    # Test a simple query routing through the executor
    req = RouterRequest(query="What is the current WTI crude oil price?")
    resp = execute_query(req)
    
    assert resp.answer
    assert resp.routing_decision
    assert resp.routing_decision.route == "mcp"
    assert "commodity" in resp.routing_decision.agents
    assert resp.latency_ms > 0
    
    # Test a RAG query
    req_rag = RouterRequest(query="How does Huntsman price its MDI contracts?")
    resp_rag = execute_query(req_rag)
    assert resp_rag.routing_decision.route == "rag"
    assert len(resp_rag.sources) > 0


def test_execute_query_with_model_selection():
    # Test requesting External1 (Claude) synthesis which should fall back to local iLLM if no cloud key is set
    req = RouterRequest(query="Define MDI.", model="External1")
    resp = execute_query(req)
    assert resp.answer
    assert resp.latency_ms > 0

