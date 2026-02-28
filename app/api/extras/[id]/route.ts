import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extras } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, sortOrder, active } = body;

    const [updated] = await db
      .update(extras)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: price.toString() }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
        updatedAt: new Date(),
      })
      .where(eq(extras.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Extra no encontrado" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating extra:", error);
    return NextResponse.json({ error: "Error actualizando extra" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db
      .update(extras)
      .set({ active: false })
      .where(eq(extras.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting extra:", error);
    return NextResponse.json({ error: "Error desactivando extra" }, { status: 500 });
  }
}
