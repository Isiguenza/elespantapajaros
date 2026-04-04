import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, cashRegisterTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, any> = { updatedAt: new Date() };
    
    if (body.splitBillData !== undefined) {
      updateData.splitBillData = body.splitBillData ? JSON.stringify(body.splitBillData) : null;
    }

    await db.update(orders).set(updateData).where(eq(orders.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Eliminar transacciones de caja que referencian esta orden
    await db.delete(cashRegisterTransactions).where(eq(cashRegisterTransactions.orderId, id));
    
    // Eliminar los items de la orden
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    
    // Eliminar la orden
    await db.delete(orders).where(eq(orders.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
