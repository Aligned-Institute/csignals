# ChemSignals

Market intelligence platform for chemical sector analysis. Python/FastAPI backend (iSLM router + Sage query engine) + Next.js terminal dashboard.

---

## Prerequisites

### 1. Ollama (local LLM server)

```bash
brew install ollama
ollama serve
```

Pull the three required models:

```bash
ollama pull gemma2:2b          # iSLM query classifier
ollama pull deepseek-r1:8b     # Sage synthesis model
ollama pull nomic-embed-text   # RAG embeddings
```

### 2. Python 3.11+

### 3. Node.js 20+

---

## Setup

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Copy and fill in the env file:

```bash
cp config/.env.example config/.env
```

Required keys in `config/.env`:

| Key | Required | Purpose |
|-----|----------|---------|
| `ANTHROPIC_API_KEY` | For External1 (Claude) synthesis | Falls back to internal Ollama if missing |
| `FRED_API_KEY` | For macro indicators | Free at fred.stlouisfed.org |
| `SUPABASE_URL` / `SUPABASE_KEY` | For pgvector RAG | Falls back to local `rag_store.json` if missing |

Start the backend:

```bash
bash scripts/start_islm.sh
# or directly:
python -m src.islm.app
```

Backend runs on `http://localhost:8100`.

### Frontend (terminal)

```bash
cd terminal
npm install
```

Create `terminal/.env.local`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
API_URL=http://localhost:8000
```

```bash
npm run dev
```

Dashboard runs on `http://localhost:3000`.

---

## Architecture

```
csignals/
├── src/islm/          # FastAPI backend — iSLM router + Sage executor
├── scripts/           # monday_brief.py (MCP data), RAG indexing, Supabase upload
├── terminal/          # Next.js dashboard
├── config/            # .env (gitignored), .env.example
├── tests/             # pytest suite
└── output/            # Generated briefs (created at runtime)
```

The backend routes queries through four paths:
- **rag** — local vector search against `src/islm/rag_store.json`
- **mcp** — live data via `monday_brief.py` (yfinance, FRED, RSS feeds)
- **hybrid** — both
- **direct** — model answers from context only
