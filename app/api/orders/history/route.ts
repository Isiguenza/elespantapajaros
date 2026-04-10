import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const registerId = searchParams.get("registerId");
    const startDate = searchParams.get("startDate");

    if (!registerId) {
      return NextResponse.json(
        { error: "registerId is required" },
        { status: 400 }
      );
    }

    console.log(`[History] Fetching orders for register ${registerId}, startDate: ${startDate}`);

    // Construir condiciones de filtro
    const conditions = [
      eq(orders.cashRegisterId, registerId),
      eq(orders.status, "delivered"),
      eq(orders.paymentStatus, "paid"),
    ];

    // Agregar filtro de fecha si se proporciona
    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate)));
    }

    // Obtener órdenes completadas y pagadas
    const completedOrders = await db.query.orders.findMany({
      where: and(...conditions),
      with: {
        items: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    console.log(`[History] Found ${completedOrders.length} orders`);
    
    // Aplicar descuento del 27% a órdenes de platform_delivery
    const ordersWithDiscount = completedOrders.map(order => {
      if (order.paymentMethod === 'platform_delivery') {
        const originalTotal = parseFloat(order.total);
        const commission = originalTotal * 0.27;
        const totalAfterCommission = originalTotal * 0.73;
        
        return {
          ...order,
          total: totalAfterCommission.toFixed(2),
          platformCommission: commission.toFixed(2),
          originalTotal: originalTotal.toFixed(2),
        };
      }
      return order;
    });
    
    // Filtrar en el backend también para asegurar solo órdenes del día actual
    if (startDate) {
      const today = new Date(startDate);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const filteredOrders = ordersWithDiscount.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today && orderDate < tomorrow;
      });
      
      console.log(`[History] After date filter: ${filteredOrders.length} orders`);
      return NextResponse.json(filteredOrders);
    }

    return NextResponse.json(ordersWithDiscount);
  } catch (error) {
    console.error("Error fetching order history:", error);
    return NextResponse.json(
      { error: "Error fetching order history" },
      { status: 500 }
    );
  }
}
