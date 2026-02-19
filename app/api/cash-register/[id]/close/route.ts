import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cashRegisters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { finalCash, notes } = body;

    const register = await db.query.cashRegisters.findFirst({
      where: eq(cashRegisters.id, id),
    });

    if (!register) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const expectedCash =
      parseFloat(register.initialCash) +
      parseFloat(register.totalSales || "0");
    const difference = finalCash - expectedCash;

    const [updated] = await db
      .update(cashRegisters)
      .set({
        closedAt: new Date(),
        finalCash: finalCash.toFixed(2),
        expectedCash: expectedCash.toFixed(2),
        difference: difference.toFixed(2),
        notes: notes || null,
        status: "closed",
      })
      .where(eq(cashRegisters.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error closing register:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
