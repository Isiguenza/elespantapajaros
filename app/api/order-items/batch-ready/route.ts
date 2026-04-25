import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemIds } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "itemIds array is required" },
        { status: 400 }
      );
    }

    console.log("📦 Marking items as ready:", itemIds);

    // Marcar items como entregados a mesa (deliveredToTable = true)
    // Esto los sacará de Dispatch
    await db
      .update(orderItems)
      .set({ deliveredToTable: true })
      .where(inArray(orderItems.id, itemIds));

    // Obtener la orden para verificar si todos los items están entregados
    const items = await db.query.orderItems.findMany({
      where: inArray(orderItems.id, itemIds),
    });

    if (items.length > 0) {
      const orderId = items[0].orderId;

      // Verificar si todos los items de la orden están entregados
      const allOrderItems = await db.query.orderItems.findMany({
        where: and(
          eq(orderItems.orderId, orderId),
          eq(orderItems.voided, false)
        ),
      });

      const allDelivered = allOrderItems.every((item) => item.deliveredToTable);

      // Si todos están entregados, actualizar la orden a "ready"
      if (allDelivered) {
        await db
          .update(orders)
          .set({ status: "ready" })
          .where(eq(orders.id, orderId));
        
        console.log("✅ All items delivered, order marked as ready:", orderId);
      }
    }

    return NextResponse.json({ success: true, itemsUpdated: itemIds.length });
  } catch (error) {
    console.error("Error marking items as ready:", error);
    return NextResponse.json(
      { error: "Error marking items as ready" },
      { status: 500 }
    );
  }
}
