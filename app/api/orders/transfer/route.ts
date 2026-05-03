import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, tables } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, newTableId } = body;

    if (!orderId || !newTableId) {
      return NextResponse.json(
        { error: "Order ID and new table ID are required" },
        { status: 400 }
      );
    }

    // Check if target table is available
    const targetTable = await db.query.tables.findFirst({
      where: eq(tables.id, newTableId),
    });

    if (!targetTable) {
      return NextResponse.json(
        { error: "Target table not found" },
        { status: 404 }
      );
    }

    if (targetTable.status === "occupied") {
      return NextResponse.json(
        { error: "Target table is already occupied" },
        { status: 400 }
      );
    }

    // Get the order to transfer
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const oldTableId = order.tableId;

    // Transfer order to new table
    await db
      .update(orders)
      .set({ 
        tableId: newTableId,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));

    // Update old table status to available (if it exists)
    if (oldTableId) {
      // Check if old table has any other active orders
      const otherOrders = await db.query.orders.findMany({
        where: and(
          eq(orders.tableId, oldTableId),
          eq(orders.status, "pending")
        ),
      });

      // Only set to available if no other orders
      if (otherOrders.length === 0) {
        await db
          .update(tables)
          .set({ status: "available" })
          .where(eq(tables.id, oldTableId));
      }
    }

    // Update new table status to occupied
    await db
      .update(tables)
      .set({ status: "occupied" })
      .where(eq(tables.id, newTableId));

    return NextResponse.json({
      success: true,
      message: "Order transferred successfully",
    });
  } catch (error) {
    console.error("Error transferring order:", error);
    return NextResponse.json(
      { error: "Failed to transfer order" },
      { status: 500 }
    );
  }
}
