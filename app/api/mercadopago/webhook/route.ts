import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Webhook] Received MP notification:", JSON.stringify(body));

    // Mercado Pago Point webhook notification
    // The webhook sends payment status updates
    const { action, data } = body;

    if (!data?.id && !body.id) {
      console.log("[Webhook] No ID in notification, ignoring");
      return NextResponse.json({ received: true });
    }

    // Get payment details from Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("No MP access token configured");
      return NextResponse.json({ received: true });
    }

    if (action === "payment.created" || action === "payment.updated") {
      const paymentRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${data.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (paymentRes.ok) {
        const payment = await paymentRes.json();
        const externalReference = payment.external_reference;

        if (externalReference) {
          if (payment.status === "approved") {
            await db
              .update(orders)
              .set({
                paymentStatus: "paid",
                status: "preparing",
                mercadopagoPaymentId: payment.id.toString(),
                updatedAt: new Date(),
              })
              .where(eq(orders.id, externalReference));
          } else if (
            payment.status === "rejected" ||
            payment.status === "cancelled"
          ) {
            await db
              .update(orders)
              .set({
                paymentStatus: "failed",
                mercadopagoPaymentId: payment.id.toString(),
                updatedAt: new Date(),
              })
              .where(eq(orders.id, externalReference));
          }
        }
      }
    }

    // For Point integration-api notifications
    if (body.state === "FINISHED" && body.payment?.id) {
      const paymentIntentId = body.id;
      console.log(`[Webhook] Payment FINISHED for intent ${paymentIntentId}`);
      
      // Find order by payment intent ID
      const order = await db.query.orders.findFirst({
        where: eq(orders.mercadopagoPaymentIntentId, paymentIntentId),
      });

      if (order) {
        console.log(`[Webhook] Updating order ${order.id} to PAID`);
        await db
          .update(orders)
          .set({
            paymentStatus: "paid",
            status: "preparing",
            mercadopagoPaymentId: body.payment.id.toString(),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));
      } else {
        console.log(`[Webhook] No order found for payment intent ${paymentIntentId}`);
      }
    }

    if (body.state === "CANCELED" || body.state === "ERROR") {
      const paymentIntentId = body.id;
      const order = await db.query.orders.findFirst({
        where: eq(orders.mercadopagoPaymentIntentId, paymentIntentId),
      });

      if (order) {
        await db
          .update(orders)
          .set({
            paymentStatus: "failed",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
