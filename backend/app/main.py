import os
from dotenv import load_dotenv
load_dotenv()  # loads GROQ_API_KEY from backend/.env before anything else imports it

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.query import handle_query
from app.vectorstore import get_chunk_count, get_last_ingestion_date

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="MF FAQ Assistant API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Query cannot be empty")
        if len(v) > 500:
            raise ValueError("Query exceeds 500 character limit")
        return v


@app.post("/api/query")
@limiter.limit("10/minute")
async def query_endpoint(request: Request, body: QueryRequest):
    return handle_query(body.query)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/corpus/status")
async def corpus_status():
    return {
        "last_ingested": get_last_ingestion_date(),
        "document_count": get_chunk_count(),
    }


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "rate_limit_exceeded", "message": "Too many requests. Please wait a moment before asking another question."},
    )
