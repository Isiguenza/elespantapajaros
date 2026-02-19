import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cashRegisters, cashRegisterTransactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, amount, description } = body;

    const [transaction] = await db
      .insert(cashRegisterTransactions)
      .values({
        registerId: id,
        type,
        amount: amount.toFixed(2),
        description: description || null,
      })
      .returning();

    // Update totals if cash_in/cash_out
    if (type === "cash_in") {
      await db
        .update(cashRegisters)
        .set({
          totalSales: sql`COALESCE(${cashRegisters.totalSales}, 0) + ${amount}`,
        })
        .where(eq(cashRegisters.id, id));
    } else if (type === "cash_out") {
      await db
        .update(cashRegisters)
        .set({
          totalSales: sql`COALESCE(${cashRegisters.totalSales}, 0) - ${amount}`,
        })
        .where(eq(cashRegisters.id, id));
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
