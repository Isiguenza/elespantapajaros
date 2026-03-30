import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const body = await request.json();
    const { voidReason, voidedBy } = body;

    // Mark item as voided
    const [updatedItem] = await db
      .update(orderItems)
      .set({
        voided: true,
        voidReason: voidReason || "Sin razón especificada",
        voidedBy: voidedBy || null,
      })
      .where(eq(orderItems.id, itemId))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Recalculate order total excluding voided items
    const allItems = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, id),
    });

    const newTotal = allItems
      .filter((item) => !item.voided)
      .reduce((sum, item) => sum + parseFloat(item.subtotal) * 1, 0);

    await db
      .update(orders)
      .set({
        total: newTotal.toString(),
        subtotal: newTotal.toString(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    return NextResponse.json({ success: true, newTotal });
  } catch (error) {
    console.error("Error voiding item:", error);
    return NextResponse.json({ error: "Error voiding item" }, { status: 500 });
  }
}
