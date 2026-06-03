# MF FAQ Assistant

A RAG-based Mutual Fund FAQ chatbot that answers factual questions about Mirae Asset mutual fund schemes using official public documents from AMC, AMFI, and SEBI. It is explicitly non-advisory — it answers facts, not recommendations.

## AMC and Schemes

**AMC:** Mirae Asset Investment Managers (India)

| Scheme | Category |
|---|---|
| Mirae Asset Large Cap Fund | Large Cap Equity |
| Mirae Asset ELSS Tax Saver Fund | ELSS (Tax Saving) |
| Mirae Asset Flexi Cap Fund | Flexi Cap Equity |
| Mirae Asset Large & Midcap Fund | Large & Mid Cap (formerly Emerging Bluechip Fund) |
| Mirae Asset NYSE FANG+ ETF Fund of Fund | Thematic FoF |

## Architecture

```
RAG Pipeline:
  Offline: APScheduler → requests/pdfplumber → LangChain splitter → sentence-transformers → ChromaDB
  Online:  FastAPI → PII check → classifier → ChromaDB search → Claude Sonnet → cited answer
Frontend: Next.js 14 + Tailwind CSS
```

Full architecture: [docs/architecture.md](docs/architecture.md)

## Setup

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Add your Anthropic API key
cp .env.example .env
# Edit .env: ANTHROPIC_API_KEY=sk-ant-...

# Run ingestion (populates ChromaDB — takes ~5–10 min on first run)
python -m app.ingestion --sources corpus/sources.csv

# Start API server
uvicorn app.main:app --reload
# API available at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# UI available at http://localhost:3000
```

### Test the API directly

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the expense ratio of Mirae Asset Large Cap Fund?"}'
```

## Corpus

25 official public URLs across:
- Monthly factsheets (PDF) — Mirae Asset
- KIM documents (PDF) — Mirae Asset
- SID documents (PDF) — Mirae Asset
- Scheme detail pages — Mirae Asset website
- SEBI riskometer circulars
- AMFI investor education pages
- CAMS statement guides

Full URL list: [backend/corpus/sources.csv](backend/corpus/sources.csv)
Corpus last refreshed: 2026-06-02

## Disclaimer

This assistant provides factual information only, sourced from official public documents published by AMC, AMFI, and SEBI. It does not provide investment advice, return projections, or fund recommendations. Always consult a SEBI-registered investment advisor before making financial decisions. Mutual fund investments are subject to market risk.

## Known Limits

- Does not cover any AMC other than Mirae Asset
- No real-time NAV data — for current NAV visit amfiindia.com
- Performance queries are deflected to the official factsheet, not answered
- Corpus is English only — Hindi and other language queries may not retrieve well
- Factsheets change monthly — re-run ingestion monthly to stay current
- The "Emerging Bluechip Fund" was renamed to "Large & Midcap Fund" — both names are recognised
