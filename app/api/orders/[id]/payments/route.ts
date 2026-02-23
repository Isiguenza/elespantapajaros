import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderPayments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        payments: {
          orderBy: (payments, { asc }) => [asc(payments.createdAt)],
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const totalPaid = order.payments
      ?.filter(p => p.status === "completed")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    const orderTotal = parseFloat(order.total);
    const remaining = Math.max(0, orderTotal - totalPaid);

    return NextResponse.json({
      orderTotal,
      totalPaid,
      remaining,
      isPaidInFull: totalPaid >= orderTotal - 0.01,
      payments: order.payments || [],
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Error obteniendo pagos" },
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
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "ID de pago requerido" },
        { status: 400 }
      );
    }

    const payment = await db.query.orderPayments.findFirst({
      where: eq(orderPayments.id, paymentId),
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    if (payment.orderId !== id) {
      return NextResponse.json(
        { error: "Este pago no pertenece a esta orden" },
        { status: 400 }
      );
    }

    if (payment.status === "completed") {
      return NextResponse.json(
        { error: "No se puede eliminar un pago completado" },
        { status: 400 }
      );
    }

    await db.delete(orderPayments).where(eq(orderPayments.id, paymentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Error eliminando pago" },
      { status: 500 }
    );
  }
}
