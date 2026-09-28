import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${FASTAPI_URL}/history`, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({
      detail: `Backend error: ${response.status}`,
    }));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("[/api/history] Error:", error);
    return NextResponse.json(
      { detail: "History is temporarily unavailable." },
      { status: 503 }
    );
  }
}
