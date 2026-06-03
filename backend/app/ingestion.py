"""
Offline ingestion pipeline: scrape → clean → chunk → embed → store.
Run: python -m app.ingestion --sources corpus/sources.csv
"""
import argparse
import csv
import json
import os
from datetime import date

import pdfplumber
import requests
from bs4 import BeautifulSoup
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.vectorstore import embed_and_store

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
REQUEST_TIMEOUT = 30
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


def fetch_document(url: str) -> str:
    """Fetch a URL and return its text content. Handles PDF and HTML."""
    if url.lower().endswith(".pdf"):
        return _extract_pdf_text(url)
    return _extract_html_text(url)


def _extract_pdf_text(url: str) -> str:
    response = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    import io
    with pdfplumber.open(io.BytesIO(response.content)) as pdf:
        pages = []
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
    return "\n".join(pages)


def _extract_html_text(url: str) -> str:
    response = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)


def clean_text(raw: str) -> str:
    """Strip boilerplate, normalize whitespace, remove page numbers."""
    import re
    text = re.sub(r"\n{3,}", "\n\n", raw)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"(?m)^\s*\d+\s*$", "", text)  # standalone page numbers
    return text.strip()


def chunk_text(text: str, source_meta: dict) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    chunks = splitter.split_text(text)
    return [{"text": c, "metadata": source_meta} for c in chunks]


def ingest_sources(sources_csv: str) -> dict:
    """
    Read sources.csv, fetch each URL, chunk and embed.
    Returns a report dict with counts and any failed URLs.
    """
    report = {"last_ingested": str(date.today()), "total": 0, "stored": 0, "failed": []}
    all_chunks = []

    with open(sources_csv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # De-duplicate URLs before fetching (multiple schemes share the same factsheet PDF)
    seen_urls: dict[str, str] = {}
    for row in rows:
        url = row["url"]
        if url not in seen_urls:
            seen_urls[url] = row

    report["total"] = len(seen_urls)

    for url, row in seen_urls.items():
        try:
            print(f"Fetching: {url}")
            raw = fetch_document(url)
            cleaned = clean_text(raw)
            meta = {
                "source_url": url,
                "scheme_name": row["scheme"],
                "source_type": row["source_type"],
                "date_fetched": str(date.today()),
            }
            chunks = chunk_text(cleaned, meta)
            all_chunks.extend(chunks)
            print(f"  → {len(chunks)} chunks")
        except Exception as e:
            print(f"  FAILED: {e}")
            report["failed"].append({"url": url, "error": str(e)})

    stored = embed_and_store(all_chunks)
    report["stored"] = stored

    os.makedirs("./chroma_db", exist_ok=True)
    with open("./chroma_db/ingest_report.json", "w") as f:
        json.dump(report, f, indent=2)

    print(f"\nIngestion complete: {stored} chunks stored, {len(report['failed'])} failures")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--sources", default="corpus/sources.csv")
    args = parser.parse_args()
    ingest_sources(args.sources)
