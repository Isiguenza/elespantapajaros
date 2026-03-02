import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { modifierOptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, sortOrder, active } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (active !== undefined) updateData.active = active;

    const [updated] = await db
      .update(modifierOptions)
      .set(updateData)
      .where(eq(modifierOptions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Modifier option not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating modifier option:", error);
    return NextResponse.json(
      { error: "Error updating modifier option" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(modifierOptions)
      .where(eq(modifierOptions.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Modifier option not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting modifier option:", error);
    return NextResponse.json(
      { error: "Error deleting modifier option" },
      { status: 500 }
    );
  }
}
