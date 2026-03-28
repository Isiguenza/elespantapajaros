import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { deliveredToTable } = body;

    if (typeof deliveredToTable !== "boolean") {
      return NextResponse.json(
        { error: "deliveredToTable must be a boolean" },
        { status: 400 }
      );
    }

    const [item] = await db
      .update(orderItems)
      .set({
        deliveredToTable,
      })
      .where(eq(orderItems.id, id))
      .returning();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating order item delivered status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
