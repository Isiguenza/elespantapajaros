import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cashRegisters } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const result = await db.query.cashRegisters.findMany({
      where: status
        ? eq(cashRegisters.status, status as "open" | "closed")
        : undefined,
      orderBy: [desc(cashRegisters.openedAt)],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching cash registers:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initialCash } = body;

    // Check if there's already an open register
    const existing = await db.query.cashRegisters.findFirst({
      where: eq(cashRegisters.status, "open"),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya hay una caja abierta" },
        { status: 400 }
      );
    }

    const [register] = await db
      .insert(cashRegisters)
      .values({
        openedBy: "00000000-0000-0000-0000-000000000000", // placeholder until auth wired
        initialCash: initialCash.toFixed(2),
        totalSales: "0",
        totalOrders: 0,
        status: "open",
      })
      .returning();

    return NextResponse.json(register, { status: 201 });
  } catch (error) {
    console.error("Error opening cash register:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
