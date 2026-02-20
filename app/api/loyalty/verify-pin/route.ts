import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loyaltyCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcodeValue, pin } = body;

    if (!barcodeValue || !pin) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const card = await db.query.loyaltyCards.findFirst({
      where: eq(loyaltyCards.barcodeValue, barcodeValue),
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // If card has no PIN, allow access
    if (!card.pinHash) {
      return NextResponse.json({ verified: true });
    }

    // Verify PIN
    const isValid = await bcrypt.compare(pin, card.pinHash);

    if (!isValid) {
      return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
