#!/bin/bash
# Start the Signals iSLM Router
# from: /Users/warmachine/Documents/PROJECTS/ALI/Labs/Research/csignals

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Ensure Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "Starting Ollama..."
  ollama serve &
  sleep 3
fi

# Check model is available
if ! ollama list | grep -q "gemma2:2b"; then
  echo "Pulling gemma2:2b..."
  ollama pull gemma2:2b
fi

echo "Starting iSLM Router on http://localhost:8100"
python3 -m uvicorn src.islm.app:app --host 0.0.0.0 --port 8100 --reload
