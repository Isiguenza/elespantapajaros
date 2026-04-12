import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, cashRegisterTransactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { paymentMethod } = await request.json();
    const { id: orderId } = await params;

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "paymentMethod is required" },
        { status: 400 }
      );
    }

    // Validar que el paymentMethod sea válido
    const validMethods = ["cash", "terminal_mercadopago", "card", "transfer", "split", "platform_delivery"];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    console.log(`[Update Payment Method] Order ${orderId} -> ${paymentMethod}`);

    // Obtener la orden actual
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Only paid orders can have their payment method updated" },
        { status: 400 }
      );
    }

    const oldPaymentMethod = order.paymentMethod;

    // Actualizar el método de pago en la orden
    await db
      .update(orders)
      .set({ 
        paymentMethod,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Actualizar la transacción en la caja registradora si existe
    if (order.cashRegisterId) {
      const transaction = await db.query.cashRegisterTransactions.findFirst({
        where: and(
          eq(cashRegisterTransactions.cashRegisterId, order.cashRegisterId),
          eq(cashRegisterTransactions.orderId, orderId),
          eq(cashRegisterTransactions.type, "sale")
        ),
      });

      if (transaction) {
        await db
          .update(cashRegisterTransactions)
          .set({ 
            paymentMethod,
            updatedAt: new Date(),
          })
          .where(eq(cashRegisterTransactions.id, transaction.id));
        
        console.log(`[Update Payment Method] Transaction ${transaction.id} updated`);
      }
    }

    console.log(`✅ Payment method updated: ${oldPaymentMethod} -> ${paymentMethod}`);

    return NextResponse.json({ 
      success: true,
      oldPaymentMethod,
      newPaymentMethod: paymentMethod,
    });
  } catch (error) {
    console.error("Error updating payment method:", error);
    return NextResponse.json(
      { error: "Error updating payment method" },
      { status: 500 }
    );
  }
}
