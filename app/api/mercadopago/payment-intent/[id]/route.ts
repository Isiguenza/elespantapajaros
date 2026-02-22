import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, mercadopagoDevices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentIntentId } = await params;
    
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 500 });
    }

    // Get the active device
    const device = await db.query.mercadopagoDevices.findFirst({
      where: (d, { eq }) => eq(d.active, true),
    });

    if (!device) {
      return NextResponse.json({ error: "No device found" }, { status: 404 });
    }

    // Get payment intent status from MP
    const response = await fetch(
      `https://api.mercadopago.com/point/integration-api/devices/${device.deviceId}/payment-intents/${paymentIntentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch" }, { status: response.status });
    }

    const intentData = await response.json();
    console.log(`[MP] Payment intent ${paymentIntentId} status:`, intentData.state);

    // If payment is finished, update the order
    if (intentData.state === "FINISHED" && intentData.payment?.id) {
      const order = await db.query.orders.findFirst({
        where: eq(orders.mercadopagoPaymentIntentId, paymentIntentId),
      });

      if (order && order.paymentStatus !== "paid") {
        console.log(`[MP] Updating order ${order.id} to paid`);
        await db
          .update(orders)
          .set({
            paymentStatus: "paid",
            status: "preparing",
            mercadopagoPaymentId: intentData.payment.id.toString(),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));
      }
    }

    return NextResponse.json(intentData);
  } catch (error) {
    console.error("Error fetching payment intent:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
