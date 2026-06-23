#!/usr/bin/env python3
"""
Sync RAG JSON Store to Supabase
Uploads local embeddings and text chunks to the live Supabase pgvector database.
"""

import os
import json
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# Setup Paths
PROJECT_ROOT = Path(__file__).parent.parent.resolve()
load_dotenv(PROJECT_ROOT / "config" / ".env")

RAG_STORE_PATH = PROJECT_ROOT / "src" / "islm" / "rag_store.json"
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


def main():
    print("\n=== Initializing Supabase Sync ===")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL or SUPABASE_KEY are not set in config/.env.")
        print("Please add these variables and try again.")
        sys.exit(1)

    if not RAG_STORE_PATH.exists():
        print(f"ERROR: Local RAG store not found at {RAG_STORE_PATH}.")
        print("Please run scripts/index_rag.py first to build the local index.")
        sys.exit(1)

    try:
        records = json.loads(RAG_STORE_PATH.read_text(encoding="utf-8"))
        print(f"Loaded {len(records)} local RAG chunks from {RAG_STORE_PATH.name}.")
    except Exception as e:
        print(f"ERROR: Failed to load local RAG store: {e}")
        sys.exit(1)

    # Format records for PostgreSQL RAG_documents table
    payload = []
    for r in records:
        payload.append({
            "id": r["id"],
            "document": r["document"],
            "content": r["text"],
            "embedding": r["embedding"]
        })

    # Prepare Supabase Postgrest Request
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/rag_documents"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates" # upsert on duplicate key
    }

    print(f"Syncing to Supabase endpoint: {endpoint}")
    
    # Upload in batches of 50 to prevent HTTP payload size errors
    batch_size = 50
    for i in range(0, len(payload), batch_size):
        batch = payload[i:i + batch_size]
        print(f"  Pushed batch {i//batch_size + 1}: chunks {i} to {min(i + batch_size, len(payload))}...")
        
        try:
            r = requests.post(endpoint, json=batch, headers=headers, timeout=15)
            if r.status_code not in (200, 201):
                print(f"ERROR: Sync failed on batch with Status {r.status_code}: {r.text}")
                sys.exit(1)
        except Exception as e:
            print(f"ERROR: Request failed: {e}")
            sys.exit(1)

    print("\n=== Supabase Sync Complete! All chunks uploaded successfully. ===\n")


if __name__ == "__main__":
    main()
