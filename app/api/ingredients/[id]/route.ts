import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingredients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, unit, currentStock, minStock, costPerUnit, active } = body;

    const [ingredient] = await db
      .update(ingredients)
      .set({
        name,
        unit,
        currentStock,
        minStock,
        costPerUnit,
        active,
        updatedAt: new Date(),
      })
      .where(eq(ingredients.id, id))
      .returning();

    return NextResponse.json(ingredient);
  } catch (error) {
    console.error("Error updating ingredient:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(ingredients).where(eq(ingredients.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
