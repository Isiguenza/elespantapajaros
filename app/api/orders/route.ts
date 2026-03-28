import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, cashRegisters, cashRegisterTransactions, productIngredients, ingredients } from "@/lib/db/schema";
import { eq, desc, inArray, sql, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const tableId = searchParams.get("tableId");
    const noTable = searchParams.get("noTable") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    console.log("🔍 GET /api/orders - Params:", { status, tableId, noTable, limit });

    const whereClauses = [];
    
    if (status) {
      const statuses = status.split(",") as ("pending" | "preparing" | "ready" | "delivered" | "cancelled")[];
      console.log("📊 Filtrando por statuses:", statuses);
      if (statuses.length === 1) {
        whereClauses.push(eq(orders.status, statuses[0]));
      } else {
        whereClauses.push(inArray(orders.status, statuses));
      }
    }
    
    if (tableId) {
      console.log("🏓 Filtrando por tableId:", tableId);
      whereClauses.push(eq(orders.tableId, tableId));
    }
    
    if (noTable) {
      console.log("📦 Filtrando órdenes sin mesa");
      whereClauses.push(sql`${orders.tableId} IS NULL`);
    }

    const whereClause = whereClauses.length > 0 
      ? whereClauses.length === 1 
        ? whereClauses[0] 
        : and(...whereClauses)
      : undefined;

    const result = await db.query.orders.findMany({
      where: whereClause,
      with: { 
        items: true,
        table: true, // Incluir información de la mesa
      },
      orderBy: [desc(orders.createdAt)],
      limit,
    });

    console.log("✅ Órdenes encontradas:", result.length);
    result.forEach(order => {
      console.log(`  - Orden ${order.id}: status=${order.status}, tableId=${order.tableId}, items=${order.items?.length || 0}`);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerName, notes, status: orderStatus, tableId, paymentMethod, loyaltyCardId } = body;

    console.log("📦 API recibió orden:", { customerName, orderStatus, tableId });

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Items required" }, { status: 400 });
    }

    // Get next order number for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastOrder = await db.query.orders.findFirst({
      where: sql`${orders.createdAt} >= ${today.toISOString()}`,
      orderBy: [desc(orders.orderNumber)],
    });
    const nextNumber = (lastOrder?.orderNumber ?? 0) + 1;

    // Calculate total
    const total = items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + item.unitPrice * item.quantity,
      0
    );

    // Find current open cash register
    const currentRegister = await db.query.cashRegisters.findFirst({
      where: eq(cashRegisters.status, "open"),
    });

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber: nextNumber,
        total: total.toFixed(2),
        customerName: customerName || null,
        notes: notes || null,
        tableId: tableId || null,
        cashRegisterId: currentRegister?.id || null,
        status: orderStatus || "pending", // Respetar el status enviado
        paymentStatus: "pending",
        paymentMethod: paymentMethod || null,
        loyaltyCardId: loyaltyCardId || null,
      })
      .returning();

    // Create order items
    const itemsToInsert = items.map(
      (item: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        notes: string | null;
        frostingId?: string | null;
        frostingName?: string | null;
        dryToppingId?: string | null;
        dryToppingName?: string | null;
        extraId?: string | null;
        extraName?: string | null;
        customModifiers?: string | null;
      }) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        subtotal: (item.unitPrice * item.quantity).toFixed(2),
        notes: item.notes,
        frostingId: item.frostingId || null,
        frostingName: item.frostingName || null,
        dryToppingId: item.dryToppingId || null,
        dryToppingName: item.dryToppingName || null,
        extraId: item.extraId || null,
        extraName: item.extraName || null,
        customModifiers: item.customModifiers || null,
      })
    );

    await db.insert(orderItems).values(itemsToInsert);

    // Return order with items
    const fullOrder = await db.query.orders.findFirst({
      where: eq(orders.id, order.id),
      with: { items: true },
    });

    return NextResponse.json(fullOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Error creating order" }, { status: 500 });
  }
}
