import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { path } = await context.params;
  const target = new URL(`${FASTAPI_URL}/social/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));

  const headers = new Headers({ Authorization: authorization });
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const hasBody = !["GET", "HEAD"].includes(req.method);

  try {
    const response = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
    });
    const body = response.status === 204 ? null : await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers: response.headers.get("content-type")
        ? { "Content-Type": response.headers.get("content-type")! }
        : undefined,
    });
  } catch {
    return NextResponse.json({ detail: "Social publishing backend is unavailable." }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
