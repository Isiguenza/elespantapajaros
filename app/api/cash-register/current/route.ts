import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cashRegisters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const register = await db.query.cashRegisters.findFirst({
      where: eq(cashRegisters.status, "open"),
    });

    if (!register) {
      return NextResponse.json({ error: "No open register" }, { status: 404 });
    }

    return NextResponse.json(register);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
