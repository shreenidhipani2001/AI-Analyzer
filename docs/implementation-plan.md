# Implementation Plan — Mutual Fund FAQ Assistant

## Phase Overview

```
Phase 1: Context Setup & Corpus  
Phase 2: Backend — Ingestion Pipeline  
Phase 3: Backend — Retrieval API  
Phase 4: Frontend — UI   
Phase 5: Integration & Testing  
Phase 6: Documentation & Submission  
```

---

## Phase 1: Context Setup & Corpus

**Goal:** Curate 15–25 official URLs and set up project structure.

### Tasks

**1.1 Project scaffold**
```bash
mf-faq-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── query.py         # Query handler
│   │   ├── ingestion.py     # Scrape + chunk + embed
│   │   ├── classifier.py    # Factual / advisory classifier
│   │   ├── pii.py           # PII detection
│   │   └── vectorstore.py   # ChromaDB wrapper
│   ├── corpus/
│   │   └── sources.csv      # All 15–25 source URLs
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Chat UI
│   │   ├── components/
│   │   │   ├── WelcomeCard.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── DisclaimerBanner.tsx
│   │   └── api/
│   │       └── query/route.ts  # Next.js API proxy
│   ├── package.json
│   └── tailwind.config.ts
├── docs/
│   ├── problemStatement.md
│   ├── architecture.md
│   ├── implementation-plan.md
│   └── edge-cases.md
├── sample-qa.md
└── README.md
```

**1.2 Sources CSV structure**
```csv
id,url,scheme,source_type,date_added
1,https://www.miraeassetmf.co.in/...,Mirae Asset Large Cap Fund,factsheet,2025-05-28
2,https://www.miraeassetmf.co.in/...,Mirae Asset ELSS Tax Saver Fund,KIM,2025-05-28
...
```

**1.3 URL list — target sources (15–25)**

| # | Source | Type | URL Pattern |
|---|---|---|---|
| 1–5 | Mirae Asset monthly factsheets (one per scheme) | Factsheet | miraeassetmf.co.in/downloads |
| 6–10 | KIM documents (one per scheme) | KIM | miraeassetmf.co.in/scheme-documents |
| 11–12 | AMFI scheme data pages (2 schemes) | AMFI | amfiindia.com/schemes |
| 13 | SEBI riskometer circular | SEBI | sebi.gov.in/circular |
| 14 | Mirae Asset FAQ / help page | AMC FAQ | miraeassetmf.co.in/faqs |
| 15 | CAS statement download guide | Statement guide | CAMS / KFintech |
| 16 | Capital gains statement guide | Tax doc | miraeassetmf.co.in or CAMS |
| 17–20 | SID excerpts (key sections) | SID | miraeassetmf.co.in/scheme-documents |
| 21–25 | AMFI investor education pages | Education | amfiindia.com/investor-corner |

---

## Phase 2: Backend — Ingestion Pipeline

**Goal:** Scrape, clean, chunk, embed, and store all corpus documents.

### 2.1 Scraper (`ingestion.py`)

```python
# Pseudocode — key logic
def fetch_document(url: str) -> str:
    if url.endswith(".pdf"):
        return extract_pdf_text(url)      # pdfplumber
    else:
        return extract_html_text(url)     # requests + BeautifulSoup

def clean_text(raw: str) -> str:
    # Remove boilerplate headers/footers
    # Normalize whitespace
    # Remove page numbers and watermarks
    return cleaned

def chunk_text(text: str, source_meta: dict) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_text(text)
    return [{"text": c, "metadata": source_meta} for c in chunks]
```

### 2.2 Embedder + Vector Store (`vectorstore.py`)

```python
# Pseudocode
def embed_and_store(chunks: list[dict]):
    model = SentenceTransformer("all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_or_create_collection("mf_faq_corpus")
    
    for chunk in chunks:
        embedding = model.encode(chunk["text"]).tolist()
        collection.add(
            ids=[generate_id()],
            embeddings=[embedding],
            documents=[chunk["text"]],
            metadatas=[chunk["metadata"]]
        )
```

### 2.3 Run ingestion
```bash
cd backend
python -m app.ingestion --sources corpus/sources.csv
# Expected output: ~300–500 chunks stored in chroma_db/
```

---

## Phase 3: Backend — Retrieval API

**Goal:** FastAPI service that receives queries, classifies them, retrieves context, calls Claude, and returns cited answers.

### 3.1 PII detection (`pii.py`)

```python
import re

PII_PATTERNS = [
    r"\b[A-Z]{5}\d{4}[A-Z]\b",         # PAN
    r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", # Aadhaar
    r"\b[\w.+]+@[\w.]+\.[a-z]{2,}\b",  # Email
    r"\b(\+91|0)?[6-9]\d{9}\b",         # Indian mobile
    r"\b\d{6,12}\b",                     # OTP / account number (conservative)
]

def contains_pii(text: str) -> bool:
    return any(re.search(p, text, re.IGNORECASE) for p in PII_PATTERNS)
```

### 3.2 Query classifier (`classifier.py`)

```python
ADVISORY_KEYWORDS = [
    "should i", "is it good", "recommend", "better than",
    "which fund", "worth investing", "best fund", "buy or sell",
    "return", "performance", "growth", "profit", "gain"
]

def classify_query(query: str) -> str:
    q = query.lower()
    if any(kw in q for kw in ADVISORY_KEYWORDS):
        return "advisory"
    return "factual"
```

### 3.3 Query handler (`query.py`)

```python
SYSTEM_PROMPT = """
You are a facts-only mutual fund FAQ assistant for Indian mutual funds.

Rules (non-negotiable):
1. Answer ONLY from the context chunks provided. Do not use external knowledge.
2. Limit your answer to 3 sentences maximum.
3. End with: Source: [the URL from the most relevant chunk metadata]
4. End with: Last updated from sources: [date from chunk metadata]
5. If context does not contain the answer, say:
   "I couldn't find that information in the official sources. Please check [source URL] directly."
6. Never provide investment advice, return projections, or fund comparisons.
"""

def handle_query(query: str) -> dict:
    if contains_pii(query):
        return pii_refusal_response()
    
    query_type = classify_query(query)
    if query_type == "advisory":
        return advisory_refusal_response()
    
    top_chunks = vector_search(query, k=5)
    context = assemble_context(top_chunks)
    answer = call_claude(SYSTEM_PROMPT, context, query)
    
    return {
        "answer": answer,
        "source_url": top_chunks[0]["metadata"]["source_url"],
        "source_date": top_chunks[0]["metadata"]["date_fetched"],
        "type": "factual"
    }
```

### 3.4 FastAPI app (`main.py`)

```python
@app.post("/api/query")
async def query_endpoint(request: QueryRequest):
    return handle_query(request.query)

@app.get("/api/corpus/status")
async def corpus_status():
    return {
        "last_ingested": get_last_ingestion_date(),
        "document_count": get_chunk_count()
    }
```

---

## Phase 4: Frontend

**Goal:** Minimal, compliant chat UI in Next.js.

### 4.1 Page layout (`page.tsx`)

```
┌─────────────────────────────────────────────────────┐
│  ⚠ Facts-only. No investment advice.  [always visible]│
├─────────────────────────────────────────────────────┤
│                                                     │
│  Welcome to the Mutual Fund FAQ Assistant           │
│  Powered by official Mirae Asset, AMFI & SEBI data  │
│                                                     │
│  Try asking:                                        │
│  › What is the expense ratio of Mirae Large Cap?   │
│  › What is the ELSS lock-in period?                │
│  › How do I download my capital gains statement?   │
│                                                     │
├─────────────────────────────────────────────────────┤
│                  [Chat messages]                    │
│                                                     │
│  [User] What is the exit load for Mirae Flexi Cap? │
│                                                     │
│  [Bot] The exit load for Mirae Asset Flexi Cap Fund │
│  is 1% if redeemed within 1 year from the date of  │
│  allotment. There is no exit load after 1 year.    │
│                                                     │
│  Source: https://miraeassetmf.co.in/...            │
│  Last updated from sources: 2025-05-28             │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Input field]                    [Send →]         │
└─────────────────────────────────────────────────────┘
```

### 4.2 Key UI decisions

- **Disclaimer banner**: fixed at top, not dismissible
- **Example questions**: clickable chips that populate the input field
- **Citation link**: displayed as a small linked text below every factual answer
- **Refusal styling**: different background color (muted amber) to distinguish from factual answers
- **Loading state**: skeleton + "Checking official sources…" message
- **No chat history**: stateless — refresh clears the conversation (by design, no PII risk)

---

## Phase 5: Integration & Testing

### 5.1 Test matrix

| Query | Expected type | Expected behavior |
|---|---|---|
| "Expense ratio of Mirae Large Cap?" | Factual | Answer + citation + date |
| "Exit load for Mirae ELSS?" | Factual | Answer + citation + date |
| "Should I invest in ELSS?" | Advisory | Polite refusal + AMFI link |
| "Which fund will give 20% returns?" | Advisory | Polite refusal |
| "My PAN is ABCDE1234F, what fund?" | PII | PII rejection |
| "How to download CAS statement?" | Factual | Step summary + link |
| "What is riskometer of Flexi Cap?" | Factual | Category + SEBI citation |
| "How does SIP work?" | Factual (general) | Answer from AMFI education page |
| "Best time to invest?" | Advisory | Polite refusal |
| "1990s mutual fund history?" | Out of scope | Not-found response |

### 5.2 End-to-end smoke test
```bash
# Start backend
cd backend && uvicorn app.main:app --reload

# Start frontend
cd frontend && npm run dev

# Test API directly
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the expense ratio of Mirae Asset Large Cap Fund?"}'
```

---

## Phase 6: Documentation & Submission

### 6.1 Deliverables checklist

- [ ] `README.md` — setup instructions, AMC + scheme scope, architecture summary, known limits
- [ ] `corpus/sources.csv` — all 15–25 source URLs
- [ ] `sample-qa.md` — 5–10 queries with answers and source links
- [ ] `docs/problemStatement.md`
- [ ] `docs/architecture.md`
- [ ] `docs/implementation-plan.md`
- [ ] `docs/edge-cases.md`
- [ ] Working prototype link or demo video (≤3 min)
- [ ] Disclaimer snippet visible in UI

### 6.2 README structure
```markdown
# MF FAQ Assistant

## AMC and Schemes
Mirae Asset — 5 schemes (Large Cap, ELSS, Flexi Cap, Emerging Bluechip, NYSE FANG+)

## Architecture
RAG: ChromaDB + sentence-transformers + Claude Sonnet + FastAPI + Next.js

## Setup
1. Clone repo
2. Add ANTHROPIC_API_KEY to backend/.env
3. cd backend && pip install -r requirements.txt
4. python -m app.ingestion --sources corpus/sources.csv
5. uvicorn app.main:app --reload
6. cd frontend && npm install && npm run dev

## Known Limits
- Corpus last refreshed: [date]
- Does not cover AMCs other than Mirae Asset
- No real-time NAV data
- Performance queries are deflected, not answered
- Corpus is English only
```

---

## Timeline (3-day sprint)

| Day | Focus | Outcome |
|---|---|---|
| Day 1 AM | Phase 1: Scaffold + source collection | 15–25 URLs confirmed, sources.csv ready |
| Day 1 PM | Phase 2: Ingestion pipeline | Vector DB populated, ~400 chunks stored |
| Day 2 AM | Phase 3: Retrieval API | FastAPI running, /api/query responding |
| Day 2 PM | Phase 4: Frontend | UI complete, connected to API |
| Day 3 AM | Phase 5: Testing | All 10 test cases passing |
| Day 3 PM | Phase 6: Docs + submission | All deliverables packaged and submitted |
