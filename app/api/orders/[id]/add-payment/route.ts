import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderPayments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, paymentMethod, userId, reference } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a cero" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Método de pago requerido" },
        { status: 400 }
      );
    }

    // Get order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "Esta orden ya está pagada completamente" },
        { status: 400 }
      );
    }

    // Calculate total paid so far
    const totalPaid = order.payments
      ?.filter(p => p.status === "completed")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    const orderTotal = parseFloat(order.total);
    const remaining = orderTotal - totalPaid;

    if (amount > remaining + 0.01) { // Allow 1 cent tolerance
      return NextResponse.json(
        { 
          error: "El monto excede el saldo pendiente",
          remaining: remaining.toFixed(2),
        },
        { status: 400 }
      );
    }

    // Create payment
    const [payment] = await db
      .insert(orderPayments)
      .values({
        orderId: id,
        amount: amount.toFixed(2),
        paymentMethod,
        status: "pending",
        userId: userId || null,
        reference: reference || null,
      })
      .returning();

    // If payment method is cash or transfer, mark as completed immediately
    if (paymentMethod === "cash" || paymentMethod === "transfer") {
      await db
        .update(orderPayments)
        .set({ status: "completed" })
        .where(eq(orderPayments.id, payment.id));
    }

    // Check if order is now fully paid
    const newTotalPaid = totalPaid + amount;
    if (newTotalPaid >= orderTotal - 0.01) {
      await db
        .update(orders)
        .set({ 
          paymentStatus: "paid",
          paymentMethod: order.payments && order.payments.length > 0 ? "cash" : paymentMethod, // Mark as cash if mixed
        })
        .where(eq(orders.id, id));
    }

    // Fetch updated payment
    const updatedPayment = await db.query.orderPayments.findFirst({
      where: eq(orderPayments.id, payment.id),
    });

    return NextResponse.json({
      payment: updatedPayment,
      orderTotal,
      totalPaid: newTotalPaid,
      remaining: Math.max(0, orderTotal - newTotalPaid),
      isPaidInFull: newTotalPaid >= orderTotal - 0.01,
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    return NextResponse.json(
      { error: "Error agregando pago" },
      { status: 500 }
    );
  }
}
