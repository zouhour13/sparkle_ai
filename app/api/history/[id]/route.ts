import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const response = await fetch(`${FASTAPI_URL}/history/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: authorization },
    });
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const data = await response.json().catch(() => ({
      detail: `Backend error: ${response.status}`,
    }));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("[/api/history/:id] Error:", error);
    return NextResponse.json(
      { detail: "History item could not be deleted." },
      { status: 503 }
    );
  }
}
