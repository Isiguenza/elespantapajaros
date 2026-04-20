import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq, sql, inArray } from "drizzle-orm";

// POST /api/orders/[id]/consolidate
// Moves items from sibling orders into this order and deletes the siblings.
// Body: { siblingOrderIds: string[] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { siblingOrderIds } = body;

    if (!siblingOrderIds || siblingOrderIds.length === 0) {
      return NextResponse.json({ success: true, message: "No siblings to consolidate" });
    }

    const mainOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!mainOrder) {
      return NextResponse.json({ error: "Main order not found" }, { status: 404 });
    }

    console.log(`🔀 Consolidating ${siblingOrderIds.length} sibling orders into ${id}`);

    // Move all items from sibling orders to the main order
    for (const siblingId of siblingOrderIds) {
      await db
        .update(orderItems)
        .set({ orderId: id })
        .where(eq(orderItems.orderId, siblingId));
    }

    // Recalculate main order total from all its items
    const allItems = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, id),
    });

    const newTotal = allItems.reduce(
      (sum, item) => sum + parseFloat(item.subtotal),
      0
    );

    await db
      .update(orders)
      .set({
        total: newTotal.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    // NO BORRAR ÓRDENES - Mantener historial completo
    // Las órdenes hermanas quedan vacías pero se mantienen en la BD para el historial
    // await db.delete(orders).where(inArray(orders.id, siblingOrderIds));

    console.log(`✅ Consolidated: ${allItems.length} total items, new total: $${newTotal.toFixed(2)} (sibling orders kept in DB)`);

    const fullOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });

    return NextResponse.json(fullOrder);
  } catch (error) {
    console.error("Error consolidating orders:", error);
    return NextResponse.json({ error: "Error consolidating" }, { status: 500 });
  }
}
