import { getAuth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: any) {
  try {
    const auth = getAuth();
    const { GET } = auth.handler();
    return GET(request, context);
  } catch {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
}

export async function POST(request: NextRequest, context: any) {
  try {
    const auth = getAuth();
    const { POST } = auth.handler();
    return POST(request, context);
  } catch {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
}
