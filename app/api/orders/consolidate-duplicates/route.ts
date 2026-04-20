import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, cashRegisters, cashRegisterTransactions } from "@/lib/db/schema";
import { eq, and, inArray, sql, gte } from "drizzle-orm";

// Agrupar órdenes por sesión: misma mesa/cliente, cercanas en tiempo (2hrs máx entre ellas)
function groupIntoSessions(ordersForKey: any[], maxGapMs = 2 * 60 * 60 * 1000): any[][] {
  if (ordersForKey.length <= 1) return [ordersForKey];
  
  // Ordenar por fecha
  const sorted = [...ordersForKey].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  const sessions: any[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].createdAt).getTime();
    const curr = new Date(sorted[i].createdAt).getTime();
    
    if (curr - prev <= maxGapMs) {
      // Misma sesión
      sessions[sessions.length - 1].push(sorted[i]);
    } else {
      // Nueva sesión
      sessions.push([sorted[i]]);
    }
  }
  return sessions;
}

/**
 * GET /api/orders/consolidate-duplicates
 * Preview: muestra qué se va a consolidar sin hacer cambios
 */
export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allOrders = await db.query.orders.findMany({
      where: gte(orders.createdAt, thirtyDaysAgo),
      with: { items: true },
    });

    // Agrupar por mesa o customerName
    const byKey = new Map<string, any[]>();
    for (const order of allOrders) {
      let key: string;
      if (order.tableId) {
        key = `table_${order.tableId}`;
      } else if (order.customerName) {
        key = `customer_${order.customerName}`;
      } else {
        continue;
      }
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(order);
    }

    const preview: any[] = [];
    for (const [key, group] of byKey.entries()) {
      const sessions = groupIntoSessions(group);
      for (const session of sessions) {
        if (session.length > 1) {
          preview.push({
            key,
            ordersCount: session.length,
            orders: session.map(o => ({
              id: o.id,
              orderNumber: o.orderNumber,
              total: o.total,
              status: o.status,
              paymentStatus: o.paymentStatus,
              createdAt: o.createdAt,
              itemsCount: o.items?.length || 0,
            })),
          });
        }
      }
    }

    return NextResponse.json({
      totalOrders: allOrders.length,
      duplicateGroups: preview.length,
      ordersToDelete: preview.reduce((sum, g) => sum + g.ordersCount - 1, 0),
      groups: preview,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

/**
 * POST /api/orders/consolidate-duplicates
 * Consolida órdenes duplicadas por sesión (misma mesa/cliente, <2hrs entre órdenes)
 */
export async function POST() {
  try {
    console.log("🔄 Iniciando consolidación de órdenes duplicadas...");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allOrders = await db.query.orders.findMany({
      where: gte(orders.createdAt, thirtyDaysAgo),
      with: { items: true },
    });

    console.log(`📊 Total órdenes: ${allOrders.length}`);

    // Agrupar por mesa o customerName
    const byKey = new Map<string, any[]>();
    for (const order of allOrders) {
      let key: string;
      if (order.tableId) {
        key = `table_${order.tableId}`;
      } else if (order.customerName) {
        key = `customer_${order.customerName}`;
      } else {
        continue;
      }
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(order);
    }

    let consolidatedCount = 0;
    let itemsMoved = 0;
    let ordersDeleted = 0;
    let extraTransactionsDeleted = 0;

    for (const [key, group] of byKey.entries()) {
      // Dividir en sesiones (máx 2hrs entre órdenes consecutivas)
      const sessions = groupIntoSessions(group);
      
      for (const session of sessions) {
        if (session.length <= 1) continue;

        console.log(`\n🔗 Sesión "${key}" con ${session.length} órdenes`);

        // La orden principal: la que tiene el total más alto (la que se pagó correctamente con el total real)
        session.sort((a: any, b: any) => parseFloat(b.total || "0") - parseFloat(a.total || "0"));
        const mainOrder = session[0];
        const duplicates = session.slice(1);

        console.log(`  ✅ Principal: #${mainOrder.orderNumber} total=${mainOrder.total} (${mainOrder.items?.length || 0} items)`);

        // Recopilar todos los item IDs que ya tiene la principal
        const mainItemIds = new Set((mainOrder.items || []).map((i: any) => i.id));

        for (const dup of duplicates) {
          console.log(`  🔄 Duplicada: #${dup.orderNumber} total=${dup.total} status=${dup.status} (${dup.items?.length || 0} items)`);
          
          // Mover items que no estén ya en la principal
          if (dup.items && dup.items.length > 0) {
            const newItems = dup.items.filter((i: any) => !mainItemIds.has(i.id));
            
            if (newItems.length > 0) {
              const newItemIds = newItems.map((i: any) => i.id);
              await db
                .update(orderItems)
                .set({ orderId: mainOrder.id })
                .where(inArray(orderItems.id, newItemIds));
              itemsMoved += newItems.length;
              // Añadir a mainItemIds para las siguientes duplicadas
              newItems.forEach((i: any) => mainItemIds.add(i.id));
              console.log(`    📦 Movidos ${newItems.length} items`);
            }
          }

          // Eliminar transacciones de caja de la duplicada
          const deletedTx = await db
            .delete(cashRegisterTransactions)
            .where(eq(cashRegisterTransactions.orderId, dup.id))
            .returning();
          if (deletedTx.length > 0) {
            extraTransactionsDeleted += deletedTx.length;
            console.log(`    💰 ${deletedTx.length} transacciones eliminadas`);
          }

          // Eliminar la orden duplicada
          await db.delete(orders).where(eq(orders.id, dup.id));
          ordersDeleted++;
          console.log(`    🗑️  #${dup.orderNumber} eliminada`);
        }

        consolidatedCount++;
      }
    }

    // Recalcular totales de TODAS las cajas registradoras abiertas
    const openRegisters = await db.query.cashRegisters.findMany({
      where: eq(cashRegisters.status, "open"),
    });

    for (const reg of openRegisters) {
      const transactions = await db.query.cashRegisterTransactions.findMany({
        where: eq(cashRegisterTransactions.registerId, reg.id),
      });

      let totalSales = 0;
      let cashSalesAmt = 0;
      let transferSalesAmt = 0;
      let terminalSalesAmt = 0;
      let totalOrdersCount = 0;

      for (const tx of transactions) {
        if (tx.type === "sale") {
          const amt = parseFloat(tx.amount);
          totalSales += amt;
          totalOrdersCount++;
          if (tx.paymentMethod === "cash") cashSalesAmt += amt;
          else if (tx.paymentMethod === "transfer") transferSalesAmt += amt;
          else if (tx.paymentMethod === "terminal_mercadopago" || tx.paymentMethod === "card") terminalSalesAmt += amt;
          else if (tx.paymentMethod === "split") cashSalesAmt += amt;
          else if (tx.paymentMethod === "platform_delivery") transferSalesAmt += amt;
        }
      }

      await db
        .update(cashRegisters)
        .set({
          totalSales: totalSales.toString(),
          totalOrders: totalOrdersCount,
          cashSales: cashSalesAmt.toString(),
          transferSales: transferSalesAmt.toString(),
          terminalSales: terminalSalesAmt.toString(),
        })
        .where(eq(cashRegisters.id, reg.id));

      console.log(`💰 Caja ${reg.id.slice(0,8)} recalculada: ${totalOrdersCount} órdenes, $${totalSales.toFixed(2)}`);
    }

    console.log("\n✅ Consolidación completada:");
    console.log(`  - Sesiones consolidadas: ${consolidatedCount}`);
    console.log(`  - Items movidos: ${itemsMoved}`);
    console.log(`  - Órdenes eliminadas: ${ordersDeleted}`);
    console.log(`  - Transacciones extra eliminadas: ${extraTransactionsDeleted}`);

    return NextResponse.json({
      success: true,
      stats: {
        groupsConsolidated: consolidatedCount,
        itemsMoved,
        ordersDeleted,
        extraTransactionsDeleted,
      },
    });
  } catch (error) {
    console.error("❌ Error consolidando:", error);
    return NextResponse.json({ error: "Error consolidando" }, { status: 500 });
  }
}
