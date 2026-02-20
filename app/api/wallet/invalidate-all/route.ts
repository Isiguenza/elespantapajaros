import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loyaltyCards } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    // Update all loyalty cards' updatedAt timestamp to trigger Apple Wallet refresh
    const result = await db
      .update(loyaltyCards)
      .set({ updatedAt: sql`NOW()` })
      .returning({ id: loyaltyCards.id });

    return NextResponse.json({ 
      success: true, 
      updated: result.length,
      message: `${result.length} tarjetas actualizadas. Los passes se actualizarán en Apple Wallet.`
    });
  } catch (error) {
    console.error("Error invalidating passes:", error);
    return NextResponse.json({ error: "Error al invalidar passes" }, { status: 500 });
  }
}
