import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dryToppings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, sortOrder, active } = body;

    const [updated] = await db
      .update(dryToppings)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
        updatedAt: new Date(),
      })
      .where(eq(dryToppings.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Escarchado seco no encontrado" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating dry topping:", error);
    return NextResponse.json({ error: "Error actualizando escarchado seco" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db
      .update(dryToppings)
      .set({ active: false })
      .where(eq(dryToppings.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dry topping:", error);
    return NextResponse.json({ error: "Error desactivando escarchado seco" }, { status: 500 });
  }
}
