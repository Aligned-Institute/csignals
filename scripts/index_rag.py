#!/usr/bin/env python3
"""
RAG Ingestion and Indexing Script
Processes competitor reports, filings, and value chain markdown guides.
Chunks text, generates embeddings via Ollama's nomic-embed-text model,
and saves the index locally to src/islm/rag_store.json.
"""

import os
import json
import requests
from pathlib import Path
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Setup Paths
PROJECT_ROOT = Path(__file__).parent.parent.resolve()
INTEL_DIR = PROJECT_ROOT / "clients" / "huntsman" / "intel"
STORE_PATH = PROJECT_ROOT / "src" / "islm" / "rag_store.json"

OLLAMA_EMBED_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = "nomic-embed-text"

def get_embedding(text: str) -> list[float]:
    """Call local Ollama embeddings API."""
    try:
        response = requests.post(
            OLLAMA_EMBED_URL,
            json={"model": EMBED_MODEL, "prompt": text},
            timeout=10
        )
        if response.status_code == 200:
            return response.json().get("embedding", [])
        else:
            print(f"Error calling Ollama API: Status {response.status_code}")
            return []
    except Exception as e:
        print(f"Failed to query Ollama API: {e}")
        return []

def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract page text from a PDF document."""
    try:
        reader = PdfReader(pdf_path)
        text_parts = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as e:
        print(f"Error reading PDF {pdf_path.name}: {e}")
        return ""

def main():
    print("\n=== Initializing private RAG indexing script ===")
    
    # 1. Gather all documents to index
    if not INTEL_DIR.exists():
        print(f"Error: Intel directory {INTEL_DIR} not found.")
        return
        
    documents = []
    # Index both .md and .pdf files
    for file_path in INTEL_DIR.iterdir():
        if file_path.name.startswith('.'):
            continue
            
        if file_path.suffix.lower() == '.md':
            print(f"Found Markdown: {file_path.name}")
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            documents.append({"name": file_path.name, "content": content, "type": "md"})
            
        elif file_path.suffix.lower() == '.pdf':
            # Skip massive PDFs to prevent memory bottlenecks during local run
            size_mb = file_path.stat().st_size / (1024 * 1024)
            if size_mb > 0.5:
                print(f"Skipping large PDF: {file_path.name} ({size_mb:.2f} MB)")
                continue
                
            print(f"Found PDF: {file_path.name} ({size_mb:.2f} MB)")
            content = extract_text_from_pdf(file_path)
            if content.strip():
                documents.append({"name": file_path.name, "content": content, "type": "pdf"})
    
    if not documents:
        print("No documents found to index.")
        return
        
    print(f"\nLoaded {len(documents)} documents. Starting chunking phase...")
    
    # 2. Chunk text
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=120,
        length_function=len
    )
    
    all_chunks = []
    for doc in documents:
        chunks = text_splitter.split_text(doc["content"])
        print(f"  - Document '{doc['name']}' split into {len(chunks)} chunks.")
        for idx, chunk_text in enumerate(chunks):
            all_chunks.append({
                "doc_name": doc["name"],
                "doc_type": doc["type"],
                "chunk_idx": idx,
                "text": chunk_text
            })
            
    print(f"\nTotal chunks to embed: {len(all_chunks)}")
    
    # 3. Generate embeddings
    rag_records = []
    success_count = 0
    
    for i, chunk in enumerate(all_chunks):
        if i % 10 == 0:
            print(f"Embedding progress: {i}/{len(all_chunks)} chunks processed...")
            
        embedding = get_embedding(chunk["text"])
        if embedding:
            rag_records.append({
                "id": f"chunk_{i}",
                "document": chunk["doc_name"],
                "text": chunk["text"],
                "embedding": embedding
            })
            success_count += 1
            
    print(f"\nSuccessfully embedded {success_count}/{len(all_chunks)} chunks.")
    
    # 4. Save store locally
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        STORE_PATH.write_text(json.dumps(rag_records, indent=2), encoding="utf-8")
        print(f"\n=== RAG indexing complete. Store saved to {STORE_PATH} ===\n")
    except Exception as e:
        print(f"Failed to write RAG database store: {e}")

if __name__ == "__main__":
    main()
