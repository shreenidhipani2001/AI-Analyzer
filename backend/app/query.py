"""
Online retrieval pipeline: PII check → classify → embed → search → Claude → cited answer.
"""
import os

from groq import Groq

from app.classifier import classify_query
from app.pii import contains_pii
from app.vectorstore import SIMILARITY_THRESHOLD, vector_search

GROQ_MODEL = "llama-3.3-70b-versatile"

# Map query keywords → ChromaDB scheme_name values (must match sources.csv exactly)
_SCHEME_MAP = {
    "large cap":           "Mirae Asset Large Cap Fund",
    "largecap":            "Mirae Asset Large Cap Fund",
    "large-cap":           "Mirae Asset Large Cap Fund",
    "elss":                "Mirae Asset ELSS Tax Saver Fund",
    "tax saver":           "Mirae Asset ELSS Tax Saver Fund",
    "tax-saver":           "Mirae Asset ELSS Tax Saver Fund",
    "flexi cap":           "Mirae Asset Flexi Cap Fund",
    "flexicap":            "Mirae Asset Flexi Cap Fund",
    "flexi-cap":           "Mirae Asset Flexi Cap Fund",
    "large & midcap":      "Mirae Asset Large & Midcap Fund",
    "large and midcap":    "Mirae Asset Large & Midcap Fund",
    "large midcap":        "Mirae Asset Large & Midcap Fund",
    "emerging bluechip":   "Mirae Asset Large & Midcap Fund",
    "fang":                "Mirae Asset NYSE FANG+ ETF Fund of Fund",
    "nyse":                "Mirae Asset NYSE FANG+ ETF Fund of Fund",
    "fund of fund":        "Mirae Asset NYSE FANG+ ETF Fund of Fund",
    "fof":                 "Mirae Asset NYSE FANG+ ETF Fund of Fund",
}


def _extract_scheme(query: str) -> str | None:
    q = query.lower()
    for keyword, scheme in _SCHEME_MAP.items():
        if keyword in q:
            return scheme
    return None


def _intent_query(query: str, scheme: str | None) -> str:
    """
    When a scheme is detected, strip the scheme name from the query before embedding.
    This prevents scheme-name tokens from dominating similarity — every chunk in the
    filtered collection mentions the scheme name, so we need the embedding to focus
    on the *intent* (e.g. 'exit load') rather than the identifier.
    """
    if not scheme:
        return query
    import re
    clean = query
    for keyword in _SCHEME_MAP:
        clean = re.sub(re.escape(keyword), " ", clean, flags=re.IGNORECASE)
    clean = re.sub(r"mirae\s+asset", " ", clean, flags=re.IGNORECASE)
    clean = re.sub(r"\s{2,}", " ", clean).strip(" ?.,")
    return clean if len(clean) > 4 else query

SYSTEM_PROMPT = """
You are a facts-only mutual fund FAQ assistant for Indian mutual funds.

Rules (non-negotiable):
1. Answer ONLY from the context chunks provided. Do not use external knowledge.
2. Limit your answer to 3 sentences maximum.
3. End with: Source: [the URL from the most relevant chunk metadata]
4. End with: Last updated from sources: [date from chunk metadata]
5. If the context does not contain the answer, say:
   "I couldn't find that information in the official sources. Please check [source URL] directly."
6. Never provide investment advice, return projections, or fund comparisons.
7. For AUM queries, always include the as-of date within the answer sentence itself.
"""

PII_REFUSAL = (
    "For your security, please do not share personal identifiers "
    "(PAN, Aadhaar, account numbers, email, or phone) here. "
    "I can only answer general factual questions about mutual fund schemes."
)

ADVISORY_REFUSAL = (
    "This assistant answers factual questions about mutual fund schemes only — "
    "such as expense ratios, exit loads, or minimum SIP amounts. "
    "Questions about whether to invest, fund comparisons, or return expectations "
    "are outside what I can help with here.\n\n"
    "For investor education: https://www.amfiindia.com/investor"
)

PERFORMANCE_REFUSAL_TEMPLATE = (
    "Performance data changes frequently and is best reviewed directly from the official source.\n\n"
    "Factsheet: {factsheet_url}\n"
    "Last updated from sources: {date}"
)

NOT_FOUND = (
    "I couldn't find that specific information in the official sources I have access to. "
    "For the most accurate information, please visit {source_url} directly.\n\n"
    "Last updated from sources: {date}"
)

# Fallback factsheet URL when no scheme-specific chunk is found
FALLBACK_FACTSHEET = "https://www.miraeassetmf.co.in/downloads/factsheet"


def _build_context(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk["metadata"]
        parts.append(
            f"[Chunk {i}]\n"
            f"Source: {meta.get('source_url', 'unknown')}\n"
            f"Scheme: {meta.get('scheme_name', 'N/A')}\n"
            f"Type: {meta.get('source_type', 'N/A')}\n"
            f"Fetched: {meta.get('date_fetched', 'unknown')}\n\n"
            f"{chunk['text']}"
        )
    return "\n\n---\n\n".join(parts)


def _call_groq(context: str, query: str) -> str:
    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=512,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"},
        ],
    )
    return completion.choices[0].message.content


def handle_query(query: str) -> dict:
    if contains_pii(query):
        return {"answer": PII_REFUSAL, "source_url": None, "source_date": None, "type": "pii_refusal"}

    query_type = classify_query(query)

    if query_type == "advisory":
        return {"answer": ADVISORY_REFUSAL, "source_url": None, "source_date": None, "type": "refusal"}

    if query_type == "performance":
        factsheet_url = FALLBACK_FACTSHEET
        date = "see factsheet"
        return {
            "answer": PERFORMANCE_REFUSAL_TEMPLATE.format(factsheet_url=factsheet_url, date=date),
            "source_url": factsheet_url,
            "source_date": None,
            "type": "refusal",
        }

    scheme = _extract_scheme(query)
    embed_q = _intent_query(query, scheme)
    chunks = vector_search(query, k=10, scheme_filter=scheme, embed_query=embed_q)

    if not chunks:
        return {
            "answer": NOT_FOUND.format(
                source_url="https://www.miraeassetmf.co.in", date="unknown"
            ),
            "source_url": "https://www.miraeassetmf.co.in",
            "source_date": None,
            "type": "not_found",
        }

    # Prefer statement/tax guide chunks for relevant queries; re-sort to surface them first
    PRIORITY_TYPES = {"statement_guide", "tax_guide", "AMC_FAQ", "scheme_page"}
    priority = [c for c in chunks if c["metadata"].get("source_type") in PRIORITY_TYPES]
    rest = [c for c in chunks if c["metadata"].get("source_type") not in PRIORITY_TYPES]
    ordered_chunks = priority + rest

    context = _build_context(ordered_chunks)
    answer = _call_groq(context, query)
    top = ordered_chunks[0]["metadata"]

    # If the LLM signalled it couldn't find the answer, return not_found type
    response_type = "not_found" if "couldn't find" in answer.lower() else "factual"

    return {
        "answer": answer,
        "source_url": top.get("source_url"),
        "source_date": top.get("date_fetched"),
        "type": response_type,
    }
