import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loyaltyCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");

    if (!barcode) {
      return NextResponse.json({ error: "Barcode required" }, { status: 400 });
    }

    const card = await db.query.loyaltyCards.findFirst({
      where: eq(loyaltyCards.barcodeValue, barcode),
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Error searching loyalty card:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
