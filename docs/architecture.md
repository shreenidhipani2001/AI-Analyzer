# Architecture — Mutual Fund FAQ Assistant

## System Overview

The system follows a classic RAG (Retrieval-Augmented Generation) pattern split into two pipelines: an **offline ingestion pipeline** that builds the knowledge base from official public sources, and an **online retrieval pipeline** that processes user queries and returns cited factual answers.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND                                      │
│                                                                         │
│  ┌─────────────────────────────────┐   ┌──────────────────────────────┐ │
│  │     INGESTION (Offline)         │   │    RETRIEVAL (Online)        │ │
│  │                                 │   │                              │ │
│  │  Scheduler                      │   │  User Query                  │ │
│  │      ↓                          │   │      ↓                       │ │
│  │  Scrape + Fetch URLs            │   │  Embed Query                 │ │
│  │      ↓                          │   │      ↓                       │ │
│  │  Clean + Normalize              │   │  Vector Similarity Search    │ │
│  │      ↓                          │   │      ↓                       │ │
│  │  Chunk Text                     │   │  Retrieve Top-K Chunks       │ │
│  │      ↓                          │   │      ↓                       │ │
│  │  Embed Chunks                   │   │  LLM Prompt                  │ │
│  │      ↓                          │   │  (context + query + rules)   │ │
│  │  Store in Vector DB ←───────────┤   │      ↓                       │ │
│  │                                 │   │  Cited Factual Answer        │ │
│  └─────────────────────────────────┘   └──────────────────────────────┘ │
│                                                         ↑ API           │
└─────────────────────────────────────────────────────────────────────────┘
                                                          │
┌─────────────────────────────────────────────────────────┐
│                         FRONTEND                        │
│   User Input / Query  →  Chat UI  →  Generated Answer  │
└─────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Offline Ingestion Pipeline

**Trigger:** Scheduled job (weekly or on-demand)

**Steps:**

| Step | Component | Detail |
|---|---|---|
| Schedule | APScheduler / cron | Weekly refresh of corpus |
| Fetch | `requests` + `BeautifulSoup` / `pdfplumber` | Fetch HTML pages and extract text from PDFs |
| Clean | Custom normalizer | Strip boilerplate, headers, footers; normalize whitespace |
| Chunk | LangChain `RecursiveCharacterTextSplitter` | ~500 tokens per chunk, 50-token overlap |
| Embed | `sentence-transformers` (`all-MiniLM-L6-v2`) | Produce dense vectors for each chunk |
| Store | ChromaDB (local) or FAISS | Persist chunks with metadata: source URL, date fetched, scheme name |

**Metadata stored per chunk:**
```json
{
  "chunk_id": "mirae-large-cap-kim-chunk-004",
  "source_url": "https://www.miraeassetmf.co.in/...",
  "source_type": "KIM",
  "scheme_name": "Mirae Asset Large Cap Fund",
  "date_fetched": "2025-05-28",
  "page_number": 2
}
```

---

### 2. Online Retrieval Pipeline

**Trigger:** User submits a query via the frontend

**Steps:**

| Step | Component | Detail |
|---|---|---|
| Input validation | FastAPI middleware | PII detection regex → reject if matched |
| Query classification | LLM classifier (Claude) | Factual vs. advisory vs. performance → route accordingly |
| Query embedding | Same embedding model | Embed the user's cleaned query |
| Similarity search | ChromaDB / FAISS | Top-K=5 chunks by cosine similarity |
| Context assembly | Python | Concatenate retrieved chunks + their source URLs |
| LLM prompt | Claude API (Sonnet) | System prompt enforces: facts only, ≤3 sentences, 1 citation, date footer |
| Response formatting | Python | Append source URL + "Last updated" date |
| API response | FastAPI JSON | Return answer, source_url, date_fetched to frontend |

**System prompt (key excerpt):**
```
You are a facts-only mutual fund FAQ assistant. Rules:
1. Answer only from the context provided. Do not add external knowledge.
2. Maximum 3 sentences per answer.
3. Cite exactly one source URL from the context metadata.
4. Append: "Last updated from sources: [date]"
5. If the query asks for investment advice, fund comparison, or return projections,
   respond with the standard refusal message and an AMFI/SEBI educational link.
6. If no relevant context is found, say: "I couldn't find that information in
   the official sources. Please check [AMC URL] directly."
```

---

### 3. Frontend

**Stack:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui

**Key components:**

| Component | Purpose |
|---|---|
| `WelcomeCard` | Headline + 3 clickable example questions + disclaimer banner |
| `ChatInput` | Text input with PII masking (client-side pre-check) |
| `MessageBubble` | Renders answer text + citation link + date footer |
| `RefusalBubble` | Styled differently — shows refusal copy + educational link |
| `DisclaimerBanner` | Persistent, pinned at top — "Facts-only. No investment advice." |

**API contract (frontend ↔ backend):**
```
POST /api/query
Body: { "query": "string" }

Response: {
  "answer": "string",
  "source_url": "string",
  "source_date": "YYYY-MM-DD",
  "type": "factual" | "refusal" | "not_found"
}
```

---

### 4. Backend API

**Stack:** Python 3.11 + FastAPI + LangChain

**Endpoints:**

| Endpoint | Method | Description |
|---|---|---|
| `/api/query` | POST | Main query endpoint |
| `/api/health` | GET | Health check |
| `/api/corpus/status` | GET | Last ingestion date, document count |

**Middleware:**
- PII detection (regex on input before any LLM call)
- Request logging (no query content stored, only timestamp + query type)
- Rate limiting (10 req/min per IP)

---

### 5. Vector Database

**Choice:** ChromaDB (local, persistent)

**Why ChromaDB over FAISS:**
- Persistent by default (no manual save/load)
- Built-in metadata filtering (useful to filter by scheme or source type)
- Simple Python API, no external service needed for this corpus size

**Collection structure:**
```
Collection: mf_faq_corpus
  Documents: ~300–500 chunks (15–25 URLs × avg 15–25 chunks each)
  Embedding dimension: 384 (all-MiniLM-L6-v2)
  Metadata fields: source_url, source_type, scheme_name, date_fetched
```

---

## Data Flow Diagram (Query Path)

```
User types query
      │
      ▼
[Frontend: PII pre-check]
      │ clean query
      ▼
POST /api/query
      │
      ▼
[FastAPI: PII regex middleware] ──── PII detected ──→ Safe rejection response
      │ clean
      ▼
[Query classifier: factual / advisory / performance?]
      │ advisory or performance
      ├──────────────────────────────→ Refusal response
      │ factual
      ▼
[Embed query]
      │
      ▼
[ChromaDB similarity search → top-5 chunks]
      │
      ▼
[Assemble prompt: system rules + chunks + query]
      │
      ▼
[Claude API call]
      │
      ▼
[Format: answer + source_url + date]
      │
      ▼
JSON response → Frontend renders MessageBubble
```

---

## Security Considerations

| Risk | Mitigation |
|---|---|
| PII leakage | Regex detection at middleware level + client-side pre-check |
| Prompt injection | System prompt reinforces strict context-only answering; user input is sandboxed in the `user` role |
| Data persistence | No conversation history stored; stateless API |
| Source drift | Scheduled re-scrape with date tracking; "last updated" shown to user |
| LLM hallucination | Strict system prompt: "Answer only from the context provided" |

---

## Technology Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui, TypeScript |
| API | FastAPI (Python 3.11), Pydantic v2 |
| RAG framework | LangChain |
| LLM | Anthropic Claude Sonnet (via API) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector DB | ChromaDB |
| Scraping | requests, BeautifulSoup4, pdfplumber |
| Scheduler | APScheduler |
| Deployment | Vercel (frontend) + Railway / Render (backend) |

---

## Scalability Notes

This architecture is intentionally small-corpus. The design decisions that would change at scale:

| Constraint | Current approach | At-scale alternative |
|---|---|---|
| Corpus size | 15–25 URLs, ~400 chunks | Managed vector DB (Pinecone, Weaviate) |
| Embedding model | Local sentence-transformers | Hosted embeddings API |
| Scheduling | APScheduler in-process | Celery + Redis / Cloud Scheduler |
| Conversation history | Stateless | Redis session store (with TTL, no PII) |
