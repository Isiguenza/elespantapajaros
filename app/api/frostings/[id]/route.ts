import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { frostings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, sortOrder, active } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (active !== undefined) updateData.active = active;

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(frostings)
      .set(updateData)
      .where(eq(frostings.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Frosting not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating frosting:", error);
    return NextResponse.json({ error: "Error updating frosting" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete - just deactivate
    const [updated] = await db
      .update(frostings)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(frostings.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Frosting not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Frosting deactivated" });
  } catch (error) {
    console.error("Error deleting frosting:", error);
    return NextResponse.json({ error: "Error deleting frosting" }, { status: 500 });
  }
}
