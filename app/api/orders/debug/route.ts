import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { gte, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const registerId = searchParams.get("registerId");
    
    // Fecha de ayer
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log("📅 Buscando órdenes de ayer:", yesterday.toISOString(), "hasta", today.toISOString());
    if (registerId) {
      console.log("💰 Filtrando por caja:", registerId);
    }

    // Todas las órdenes de ayer
    const allYesterday = await db.query.orders.findMany({
      where: registerId 
        ? and(
            gte(orders.createdAt, yesterday),
            sql`${orders.createdAt} < ${today}`,
            sql`${orders.cashRegisterId} = ${registerId}`
          )
        : and(
            gte(orders.createdAt, yesterday),
            sql`${orders.createdAt} < ${today}`
          ),
    });

    // Órdenes pagadas de ayer
    const paidYesterday = allYesterday.filter(o => o.paymentStatus === "paid");

    // Órdenes delivered de ayer
    const deliveredYesterday = allYesterday.filter(o => o.status === "delivered");

    // Órdenes pagadas Y delivered de ayer
    const paidAndDelivered = allYesterday.filter(o => o.paymentStatus === "paid" && o.status === "delivered");

    // Calcular totales
    const totalAll = allYesterday.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
    const totalPaid = paidYesterday.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
    const totalDelivered = deliveredYesterday.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
    const totalPaidAndDelivered = paidAndDelivered.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);

    // Agrupar por status
    const byStatus = allYesterday.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar por paymentStatus
    const byPaymentStatus = allYesterday.reduce((acc, o) => {
      acc[o.paymentStatus] = (acc[o.paymentStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar por cashRegisterId
    const byCashRegister = allYesterday.reduce((acc, o) => {
      const key = o.cashRegisterId || "sin_caja";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      fecha: yesterday.toISOString().split('T')[0],
      totales: {
        todas: { count: allYesterday.length, total: totalAll },
        pagadas: { count: paidYesterday.length, total: totalPaid },
        delivered: { count: deliveredYesterday.length, total: totalDelivered },
        pagadasYDelivered: { count: paidAndDelivered.length, total: totalPaidAndDelivered },
      },
      porStatus: byStatus,
      porPaymentStatus: byPaymentStatus,
      porCashRegister: byCashRegister,
      muestraDeOrdenes: allYesterday.slice(0, 5).map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: o.total,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
