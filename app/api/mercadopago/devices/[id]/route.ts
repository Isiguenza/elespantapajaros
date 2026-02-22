import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mercadopagoDevices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { active } = body;

    const result = await db
      .update(mercadopagoDevices)
      .set({ active })
      .where(eq(mercadopagoDevices.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating device:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .delete(mercadopagoDevices)
      .where(eq(mercadopagoDevices.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting device:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
