import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { modifierSteps } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { stepName, sortOrder, isRequired, allowMultiple, active } = body;

    const updateData: any = {};
    if (stepName !== undefined) updateData.stepName = stepName;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isRequired !== undefined) updateData.isRequired = isRequired;
    if (allowMultiple !== undefined) updateData.allowMultiple = allowMultiple;
    if (active !== undefined) updateData.active = active;

    const [updated] = await db
      .update(modifierSteps)
      .set(updateData)
      .where(eq(modifierSteps.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Modifier step not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating modifier step:", error);
    return NextResponse.json(
      { error: "Error updating modifier step" },
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
      .delete(modifierSteps)
      .where(eq(modifierSteps.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Modifier step not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting modifier step:", error);
    return NextResponse.json(
      { error: "Error deleting modifier step" },
      { status: 500 }
    );
  }
}
