import chromadb

COLLECTION_NAME = "mf_faq_corpus"
CHROMA_PATH = "./chroma_db"
EMBED_MODEL = "all-MiniLM-L6-v2"
SIMILARITY_THRESHOLD = 0.4

_model = None
_client = None
_collection = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(EMBED_MODEL)
    return _model


def _get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=CHROMA_PATH)
        _collection = _client.get_or_create_collection(COLLECTION_NAME)
    return _collection


def embed_and_store(chunks: list[dict]) -> int:
    """
    Embed a list of {text, metadata} chunks and store in ChromaDB.
    Uses upsert so re-running ingestion updates existing chunks without duplicates.
    Returns total count stored.
    """
    if not chunks:
        return 0

    import hashlib

    model = _get_model()
    collection = _get_collection()

    texts = [c["text"] for c in chunks]

    print(f"Embedding {len(texts)} chunks with {EMBED_MODEL}…")
    embeddings = model.encode(texts, batch_size=64, show_progress_bar=True).tolist()

    # Deterministic IDs: include position index so repeated boilerplate text in the same
    # document doesn't produce duplicate hashes within a batch.
    ids = [
        hashlib.md5(
            (str(i) + c["text"] + c["metadata"].get("source_url", "")).encode()
        ).hexdigest()
        for i, c in enumerate(chunks)
    ]

    BATCH = 500  # ChromaDB safe batch ceiling
    stored = 0
    for i in range(0, len(chunks), BATCH):
        collection.upsert(
            ids=ids[i : i + BATCH],
            embeddings=embeddings[i : i + BATCH],
            documents=[c["text"] for c in chunks[i : i + BATCH]],
            metadatas=[c["metadata"] for c in chunks[i : i + BATCH]],
        )
        stored += len(ids[i : i + BATCH])
        print(f"  Stored {stored}/{len(chunks)} chunks")

    return stored


def vector_search(query: str, k: int = 10, scheme_filter: str | None = None, embed_query: str | None = None) -> list[dict]:
    """
    Embed query and return top-k chunks above SIMILARITY_THRESHOLD.
    Each result: {"text": str, "metadata": dict, "score": float}
    Returns empty list if no result meets threshold.

    scheme_filter: if provided, restrict search to chunks whose scheme_name matches.
    Distance conversion: collection uses default L2. For L2-normalised vectors
    (all-MiniLM-L6-v2 normalises by default):
        cosine_similarity = 1 - L2_distance² / 2
    """
    model = _get_model()
    collection = _get_collection()

    query_embedding = model.encode(embed_query or query).tolist()

    # When filtering by scheme:
    # - Exclude combined factsheets (multi-scheme PDFs pollute results)
    # - Always include supplementary chunks (riskometer/fund manager facts not in PDFs as text)
    if scheme_filter:
        where = {
            "$and": [
                {"$or": [
                    {"scheme_name": {"$eq": scheme_filter}},
                    {"source_type":  {"$eq": "supplementary"}},
                ]},
                {"source_type": {"$nin": ["factsheet"]}},
            ]
        }
    else:
        where = None

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        similarity = 1.0 - (dist ** 2) / 2.0
        threshold = SIMILARITY_THRESHOLD * 0.8 if scheme_filter else SIMILARITY_THRESHOLD
        if similarity >= threshold:
            chunks.append({"text": doc, "metadata": meta, "score": round(similarity, 4)})

    return chunks


def get_chunk_count() -> int:
    return _get_collection().count()


def get_last_ingestion_date() -> str:
    """Read last ingestion date from chroma_db/ingest_report.json."""
    import json, os
    report_path = f"{CHROMA_PATH}/ingest_report.json"
    if not os.path.exists(report_path):
        return "unknown"
    with open(report_path) as f:
        return json.load(f).get("last_ingested", "unknown")
