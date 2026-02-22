import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  orders,
  cashRegisters,
  cashRegisterTransactions,
  loyaltyCards,
  loyaltyTransactions,
  productIngredients,
  ingredients,
  orderItems,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { paymentMethod, loyaltyCardId, loyaltyStamps } = body;

    // Get the order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }

    if (paymentMethod === "terminal_mercadopago") {
      // Create payment intent on Mercado Pago terminal
      try {
        const mpResult = await createMercadoPagoPaymentIntent(order);
        
        // Update order with payment intent ID, but don't mark as paid yet
        await db
          .update(orders)
          .set({
            paymentMethod: "terminal_mercadopago",
            mercadopagoPaymentIntentId: mpResult.id,
            loyaltyCardId: loyaltyCardId || null,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, id));

        return NextResponse.json({
          status: "waiting_for_terminal",
          paymentIntentId: mpResult.id,
        });
      } catch (mpError) {
        console.error("Mercado Pago error:", mpError);
        const errorMessage = mpError instanceof Error ? mpError.message : "Error desconocido";
        return NextResponse.json(
          { 
            error: "Error al procesar pago con Mercado Pago", 
            details: errorMessage,
            hint: "Verifica que el Access Token esté configurado y que la terminal esté registrada"
          }, 
          { status: 500 }
        );
      }
    } else {
      // Cash payment - mark as paid immediately
      await db
        .update(orders)
        .set({
          paymentMethod: "cash",
          paymentStatus: "paid",
          status: "preparing",
          loyaltyCardId: loyaltyCardId || null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id));
    }

    // Record cash register transaction
    const currentRegister = await db.query.cashRegisters.findFirst({
      where: eq(cashRegisters.status, "open"),
    });

    if (currentRegister) {
      await db.insert(cashRegisterTransactions).values({
        registerId: currentRegister.id,
        type: "sale",
        amount: order.total,
        orderId: order.id,
        description: `Orden #${order.orderNumber}`,
      });

      // Update register totals
      await db
        .update(cashRegisters)
        .set({
          totalSales: sql`COALESCE(${cashRegisters.totalSales}, 0) + ${parseFloat(order.total)}`,
          totalOrders: sql`COALESCE(${cashRegisters.totalOrders}, 0) + 1`,
        })
        .where(eq(cashRegisters.id, currentRegister.id));
    }

    // Deduct inventory
    for (const item of order.items || []) {
      const recipe = await db.query.productIngredients.findMany({
        where: eq(productIngredients.productId, item.productId),
      });
      for (const r of recipe) {
        const deduction = parseFloat(r.quantityNeeded) * item.quantity;
        await db
          .update(ingredients)
          .set({
            currentStock: sql`GREATEST(0, CAST(${ingredients.currentStock} AS NUMERIC) - ${deduction})`,
            updatedAt: new Date(),
          })
          .where(eq(ingredients.id, r.ingredientId));
      }
    }

    // Handle loyalty stamps
    if (loyaltyCardId && loyaltyStamps > 0) {
      const card = await db.query.loyaltyCards.findFirst({
        where: eq(loyaltyCards.id, loyaltyCardId),
      });

      if (card) {
        const newStamps = card.stamps + loyaltyStamps;
        const newRewards = Math.floor(newStamps / card.stampsPerReward);
        const remainingStamps = newStamps % card.stampsPerReward;
        const additionalRewards = newRewards > 0 ? newRewards : 0;

        await db
          .update(loyaltyCards)
          .set({
            stamps: newRewards > 0 ? remainingStamps : newStamps,
            totalStamps: card.totalStamps + loyaltyStamps,
            rewardsAvailable: card.rewardsAvailable + additionalRewards,
            updatedAt: new Date(),
          })
          .where(eq(loyaltyCards.id, loyaltyCardId));

        await db.insert(loyaltyTransactions).values({
          cardId: loyaltyCardId,
          orderId: order.id,
          stampsAdded: loyaltyStamps,
        });
      }
    }

    const updatedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Error processing payment" }, { status: 500 });
  }
}

async function createMercadoPagoPaymentIntent(order: {
  id: string;
  orderNumber: number;
  total: string;
}) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
  }

  // Get the first active device
  const device = await db.query.mercadopagoDevices.findFirst({
    where: (d, { eq }) => eq(d.active, true),
  });

  if (!device) {
    throw new Error("No active Mercado Pago device found");
  }

  const response = await fetch(
    `https://api.mercadopago.com/point/integration-api/devices/${device.deviceId}/payment-intents`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: parseFloat(order.total),
        additional_info: {
          external_reference: order.id,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`MP API error: ${response.status} - ${errorData}`);
  }

  return response.json();
}
