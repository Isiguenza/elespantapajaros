import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// POST: Add items to an existing order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Items required" }, { status: 400 });
    }

    // Verify order exists
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log(`📦 Adding ${items.length} items to order ${id}`);

    // Insert new items
    const itemsToInsert = items.map(
      (item: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        notes: string | null;
        frostingId?: string | null;
        frostingName?: string | null;
        dryToppingId?: string | null;
        dryToppingName?: string | null;
        extraId?: string | null;
        extraName?: string | null;
        customModifiers?: string | null;
      }) => ({
        orderId: id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        subtotal: (item.unitPrice * item.quantity).toFixed(2),
        notes: item.notes,
        frostingId: item.frostingId || null,
        frostingName: item.frostingName || null,
        dryToppingId: item.dryToppingId || null,
        dryToppingName: item.dryToppingName || null,
        extraId: item.extraId || null,
        extraName: item.extraName || null,
        customModifiers: item.customModifiers || null,
      })
    );

    await db.insert(orderItems).values(itemsToInsert);

    // Update order total
    const newItemsTotal = items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + item.unitPrice * item.quantity,
      0
    );
    
    const newTotal = parseFloat(order.total) + newItemsTotal;
    
    await db
      .update(orders)
      .set({
        total: newTotal.toFixed(2),
        status: "preparing", // Reset to preparing since new items were added
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    // Return updated order with all items
    const fullOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });

    console.log(`✅ Order ${id} updated: ${fullOrder?.items?.length} items, total: ${fullOrder?.total}`);

    return NextResponse.json(fullOrder);
  } catch (error) {
    console.error("Error adding items to order:", error);
    return NextResponse.json({ error: "Error adding items" }, { status: 500 });
  }
}
