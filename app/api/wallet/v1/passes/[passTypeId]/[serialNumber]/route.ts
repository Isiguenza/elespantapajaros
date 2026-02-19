import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loyaltyCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Get the latest version of a pass
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      passTypeId: string;
      serialNumber: string;
    }>;
  }
) {
  const { serialNumber } = await params;

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("ApplePass ")) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    // Verify the card exists
    const card = await db.query.loyaltyCards.findFirst({
      where: eq(loyaltyCards.id, serialNumber),
    });

    if (!card) {
      return new NextResponse(null, { status: 404 });
    }

    // Redirect to the pass generation endpoint which builds the fresh pass
    const origin = request.nextUrl.origin;
    const passUrl = `${origin}/api/wallet/pass/${serialNumber}`;

    const passRes = await fetch(passUrl);
    if (!passRes.ok) {
      return new NextResponse(null, { status: 500 });
    }

    const passBuffer = await passRes.arrayBuffer();

    return new NextResponse(new Uint8Array(passBuffer), {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Last-Modified": card.updatedAt.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Error getting updated pass:", error);
    return new NextResponse(null, { status: 500 });
  }
}
