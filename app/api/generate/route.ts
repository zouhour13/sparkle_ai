import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  // 1. Auth check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate content type
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { detail: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  // 3. Forward the FormData to FastAPI
  try {
    const formData = await req.formData();

    // Validate image exists
    const imageFile = formData.get("image");
    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json({ detail: "No image provided" }, { status: 400 });
    }

    // Validate image type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { detail: "Invalid image type. Use JPG, PNG, or WEBP." },
        { status: 400 }
      );
    }

    // Forward to FastAPI
    const response = await fetch(`${FASTAPI_URL}/generate`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        detail: `Backend error: ${response.status}`,
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: unknown) {
    console.error("[/api/generate] Error:", error);

    // Connection refused — FastAPI not running
    if (
      error instanceof TypeError &&
      error.message.includes("fetch failed")
    ) {
      return NextResponse.json(
        {
          detail:
            "AI backend is not running. Please start the FastAPI server: cd sparkle-backend && uvicorn main:app --reload",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { detail: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// Block GET requests
export async function GET() {
  return NextResponse.json({ detail: "Method not allowed" }, { status: 405 });
}
