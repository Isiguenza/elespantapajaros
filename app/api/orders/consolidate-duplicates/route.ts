import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq, and, isNull, or, inArray } from "drizzle-orm";

/**
 * POST /api/orders/consolidate-duplicates
 * Consolida órdenes duplicadas del mismo cliente/mesa
 * - Agrupa órdenes con mismo customerName o tableId
 * - Mueve todos los items a la primera orden
 * - Elimina las órdenes duplicadas
 */
export async function POST() {
  try {
    console.log("🔄 Iniciando consolidación de órdenes duplicadas...");

    // 1. Buscar órdenes activas (preparing, ready, pending) sin pagar
    const activeOrders = await db.query.orders.findMany({
      where: and(
        or(
          eq(orders.status, "preparing"),
          eq(orders.status, "ready"),
          eq(orders.status, "pending")
        ),
        or(
          isNull(orders.paymentStatus),
          eq(orders.paymentStatus, "pending")
        )
      ),
      with: {
        items: true,
      },
    });

    console.log(`📊 Encontradas ${activeOrders.length} órdenes activas`);

    // 2. Agrupar por customerName o tableId
    const groupedOrders = new Map<string, typeof activeOrders>();

    for (const order of activeOrders) {
      let key: string;
      
      if (order.tableId) {
        // Agrupar por mesa
        key = `table-${order.tableId}`;
      } else if (order.customerName) {
        // Agrupar por nombre de cliente (delivery/para llevar)
        key = `customer-${order.customerName}`;
      } else {
        // Órdenes sin mesa ni nombre, no agrupar
        continue;
      }

      if (!groupedOrders.has(key)) {
        groupedOrders.set(key, []);
      }
      groupedOrders.get(key)!.push(order);
    }

    console.log(`📦 Grupos encontrados: ${groupedOrders.size}`);

    let consolidatedCount = 0;
    let itemsMoved = 0;
    let ordersDeleted = 0;

    // 3. Consolidar cada grupo
    for (const [key, ordersGroup] of groupedOrders.entries()) {
      // Solo consolidar si hay más de una orden en el grupo
      if (ordersGroup.length <= 1) continue;

      console.log(`\n🔗 Consolidando grupo "${key}" con ${ordersGroup.length} órdenes`);

      // Ordenar por fecha de creación (la más antigua primero)
      ordersGroup.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // La primera orden será la principal
      const mainOrder = ordersGroup[0];
      const duplicateOrders = ordersGroup.slice(1);

      console.log(`  ✅ Orden principal: ${mainOrder.id}`);
      console.log(`  📋 Órdenes a consolidar: ${duplicateOrders.length}`);

      // 4. Mover todos los items de las órdenes duplicadas a la orden principal
      for (const dupOrder of duplicateOrders) {
        if (dupOrder.items && dupOrder.items.length > 0) {
          console.log(`    📦 Moviendo ${dupOrder.items.length} items de orden ${dupOrder.id}`);

          // Actualizar orderId de todos los items
          const itemIds = dupOrder.items.map(item => item.id);
          
          await db
            .update(orderItems)
            .set({ orderId: mainOrder.id })
            .where(inArray(orderItems.id, itemIds));

          itemsMoved += dupOrder.items.length;
        }

        // 5. Eliminar la orden duplicada
        await db.delete(orders).where(eq(orders.id, dupOrder.id));
        ordersDeleted++;
        console.log(`    🗑️  Orden ${dupOrder.id} eliminada`);
      }

      consolidatedCount++;
    }

    console.log("\n✅ Consolidación completada:");
    console.log(`  - Grupos consolidados: ${consolidatedCount}`);
    console.log(`  - Items movidos: ${itemsMoved}`);
    console.log(`  - Órdenes eliminadas: ${ordersDeleted}`);

    return NextResponse.json({
      success: true,
      message: "Órdenes consolidadas exitosamente",
      stats: {
        groupsConsolidated: consolidatedCount,
        itemsMoved,
        ordersDeleted,
      },
    });
  } catch (error) {
    console.error("❌ Error consolidando órdenes:", error);
    return NextResponse.json(
      { error: "Error consolidando órdenes duplicadas" },
      { status: 500 }
    );
  }
}
