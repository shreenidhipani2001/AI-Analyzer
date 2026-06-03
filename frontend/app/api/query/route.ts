import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${BACKEND_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    return NextResponse.json(
      { detail: "rate_limit_exceeded", message: "Too many requests. Please wait a moment before asking another question." },
      { status: 429 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
