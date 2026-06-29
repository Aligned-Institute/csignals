# CSignals — Project Plan
**Platform:** Aligned Sovereign Intelligence — Signals Platform  
**Avatar 1:** ChemSignals (specialty chemicals / petrochemicals)  
**Last updated:** 2026-06-22  

---

## What This Is

A universal three-layer AI architecture for enterprise market intelligence:

1. **iSLM Router** — local small model (`gemma2:2b`, temp 0.0) that classifies every query and routes it to the right data source.
2. **RAG Layer** — private vector DB for static proprietary docs (never leaves the enterprise boundary).
3. **MCP Layer** — live data agents for commodity prices, macro indicators, and industry news.

The platform scales horizontally via the **Avatar model**: same iSLM + RAG + MCP core, re-skinned per vertical. ChemSignals is Avatar 1.

---

## Directory Structure

```
csignals/
├── PLAN.md                         ← This file
├── src/islm/                       ← iSLM router (FastAPI, Phase 0 active)
│   ├── app.py                      ← FastAPI server (port 8000)
│   ├── router.py                   ← Core routing logic + Ollama integration
│   ├── schemas.py                  ← Pydantic models (RoutingDecision, etc.)
│   └── config.py                   ← Env config + system prompt
├── scripts/
│   ├── start_islm.sh               ← Launcher (Ollama + uvicorn)
│   ├── monday_brief.py             ← Monday brief generator (yfinance + FRED + RSS → local DeepSeek-R1)
│   └── md_to_docx.py               ← Convert markdown briefs to Word docs
├── terminal/                       ← ChemSignals Next.js dashboard
│   ├── src/app/(protected)/        ← Dashboard, Signal Board, Charts, Value Chain, etc.
│   └── public/brief_data.json      ← JSON bridge: written by monday_brief.py
├── config/
│   ├── .env                        ← API keys (NEVER commit)
│   └── .env.example                ← Template
├── output/                         ← Generated briefs (brief_YYYY-MM-DD.md)
├── tests/
│   └── test_islm_router.py         ← 22 pytest cases (Phase 0 gate)
├── docs/
│   └── signals-whitepaper.md       ← Platform thesis
├── clients/
│   └── huntsman/                   ← Client intel, filings, notes
└── legacy/
    ├── signalsv1/                  ← AI risk intel prototype (archived)
    └── signalsv2/                  ← Huntsman interview version (archived)
```

---

## Phase 0 — iSLM Router  `[ COMPLETE ]`

**Goal:** Validate the intelligent routing core before connecting live data sources.

**Gate:** Router must correctly classify ≥18/20 test queries.

### Test coverage (22 cases in `tests/test_islm_router.py`)
* Passed the routing validation gate with **22/22 (100% pass rate)**.
* Gemma-2-2B successfully classifies incoming queries into `mcp`, `rag`, `hybrid`, or `direct` routes, and assigns the correct subset of agents.

### Run the router
```bash
# Start the router on port 8000 (connected to local Ollama)
ISLM_PORT=8000 .venv/bin/python3 -m uvicorn src.islm.app:app --host 0.0.0.0 --port 8000 --reload

# Run tests
.venv/bin/pytest tests/test_islm_router.py -v
```

---

## Phase 1 — ChemSignals Terminal & Hydration  `[ COMPLETE ]`

Next.js 16 dashboard with fully dynamic data flow from `monday_brief.py` → `brief_data.json` → React state hooks.

### Dynamic Pages
| Route | Page | Status |
|---|---|---|
| `/dashboard` | Commodity + macro cards, news feed, feedstock cost maps | ✅ Dynamic |
| `/leaderboard` | Signal Board — sortable table, anomaly alerts | ✅ Dynamic |
| `/charts` | 28-day price history Recharts and portfolio sparklines | ✅ Dynamic |
| `/ecosystem` | Value Chain — 4-segment supply chain inspector | ✅ Dynamic |
| `/portfolio` | Brief Archive — reads `output/*.md` | ✅ Dynamic |
| `/foundation-models` | Intel Reports — integrated with the running FastAPI backend | ✅ Dynamic |
| `/upload` | Data Analyzer — upload xlsx/csv | ✅ Dynamic |

---

## Phase 2 — Monday Brief Automation (Local AI Pivot)  `[ COMPLETE ]`

Generates a 5-section market intelligence brief. Sourced data spans yfinance, FRED, and RSS news feeds.
* **Local Synthesis**: Integrates a local `deepseek-r1:8b` via Ollama. It strips thinking tags `<think>...</think>` from the output files while rendering reasoning to the terminal logs for visibility.
* **Fallback**: Automatically falls back to Anthropic's cloud API if local tags are not running.

### Run manually
```bash
python3 scripts/monday_brief.py
# Writes: output/brief_YYYY-MM-DD.md
#         terminal/public/brief_data.json
```

---

## Phase 3 — iSLM + Terminal Integration  `[ COMPLETE ]`

Connect the iSLM router to the live terminal to handle incoming user queries and data analysis requests privately.

* [x] **Supabase RAG Vector Database Setup**: `executor.py` hits Supabase `match_documents` pgvector RPC first, falls back to local `rag_store.json` if unconfigured.
* [x] **Wire User Queries to Router**: `terminal/src/app/api/sage/chat/route.ts` proxies all Sage chat messages to FastAPI `/query` → iSLM router → DeepSeek-R1 synthesis.
* [x] **Implement MCP Agent Integrations**: All 6 agents live in `executor.py` — `commodity`, `macro`, `news`, `feedstock`, `brief`, `analyzer` — pulling from yfinance, FRED, RSS, and the `output/` brief archive.
* [x] **Wire Upload Page**: `terminal/src/app/api/analyze/route.ts` parses uploaded Excel/CSV, constructs a context block, and sends it to FastAPI `/query` via the hybrid route.

---

## Phase 4 — Auth + Multi-Tenant (Supabase Integration)  `[ COMPLETE — minor items pending ]`

Production hardening for client deployment.
* [x] Auth routes (login, register, forgot-password, reset-password) wired to Supabase Auth (`/auth/v1/token`, `/auth/v1/admin/users`).
* [x] JWT stored server-side in cookies via `setToken()` in `lib/auth.ts`. Protected routes gated in `app/(protected)/layout.tsx`.
* [~] Per-client namespace separation: `tenant_id` is stamped on registration but hardcoded to `tenant-test-123`. **Needs to be dynamic before multi-tenant goes live.**
* [~] `sage/generate/route.ts` portfolio save is simulated (1.5s delay + TODO comment). **Needs real backend DB write before production.**

---

## Deployment Strategy

### MVP Phase I: DigitalOcean + Supabase + Paperspace GPU (Target Stack)
* **Web Portal Hosting**: Deploy the Next.js frontend app and Python FastAPI backend on a standard **DigitalOcean Droplet** (running 24/7).
* **Database & Auth**: Leverage **Supabase** (auth + pgvector PostgreSQL DB) for user authentication and RAG document vector indexing.
* **iSLM / iLLM Engine**: Run Ollama hosting `gemma2:2b` (router) and `deepseek-r1:8b` (reasoning model) on a dedicated **Paperspace GPU instance** (DigitalOcean).
* **Connectivity**: Configure the FastAPI backend's `OLLAMA_BASE_URL` environment variable on the Droplet to point directly to the private Paperspace GPU endpoint, securing 24/7 low-latency inference at GPU speeds (30+ tokens/sec).

### MVP Phase II: AWS or GCP (Enterprise Scaling)
* **VPC Layer**: Deploy services inside a locked-down, enterprise-compliant VPC.
* **Database Migration**: Migrate Postgres and vector assets to AWS RDS / Cloud SQL.
* **GPU Compute**: Deploy Ollama on a dedicated GPU instance (e.g. AWS EC2 `g4dn.xlarge` with NVIDIA T4) to accelerate response generation.

---

## Phase 5 — Avatar Expansion  `[ ROADMAP ]`

Scale horizontally by applying the same SLM + RAG + MCP core, re-tuned per vertical market.

| Avatar | Vertical | Status |
|---|---|---|
| **ChemSignals** | Specialty chemicals / petrochemicals | Active MVP |
| **EnergySignals** | Utilities / Oil & Gas | Planned |
| **PharmSignals** | Pharmaceuticals / BioTech | Planned |
| **AgriSignals** | Agriculture / Crops | Planned |
| **MetalSignals** | Base & Precious Metals | Planned |

---

## Remaining Before Forklift (DO + Paperspace + Supabase)

1. **Dynamic `tenant_id`**: Replace hardcoded `tenant-test-123` in `register/route.ts` with a real per-client value (env var or request param).
2. **Portfolio save in Sage Generate**: Wire `sage/generate/route.ts` to a real backend DB write instead of the simulated delay.
3. **Provision DO Droplet**: Deploy Next.js frontend + FastAPI backend. Set all env vars (`SUPABASE_URL`, `SUPABASE_KEY`, `ANTHROPIC_API_KEY`, `OLLAMA_BASE_URL` → Paperspace endpoint, `FRED_API_KEY`).
4. **Provision Paperspace GPU**: Install Ollama, pull `gemma2:2b`, `deepseek-r1:8b`, `nomic-embed-text`. Expose private endpoint to Droplet.
5. **Point `OLLAMA_BASE_URL`** on Droplet to Paperspace GPU private IP.
6. **Index Huntsman intel docs into Supabase pgvector**: Run `scripts/upload_to_supabase.py` against production Supabase to populate the RAG vector store.
