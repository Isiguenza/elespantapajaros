import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loyaltyCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .delete(loyaltyCards)
      .where(eq(loyaltyCards.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Tarjeta eliminada" });
  } catch (error) {
    console.error("Error deleting loyalty card:", error);
    return NextResponse.json({ error: "Error al eliminar tarjeta" }, { status: 500 });
  }
}
