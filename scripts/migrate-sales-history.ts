import { db } from "@/lib/db";
import { orders, orderItems, salesHistory, tables } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";

async function migrateSalesToHistory() {
  console.log("🔄 Iniciando migración de ventas a sales_history...");

  try {
    // Obtener todas las órdenes pagadas de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`📅 Buscando órdenes pagadas desde: ${today.toISOString()}`);

    const paidOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.paymentStatus, "paid"),
        gte(orders.createdAt, today)
      ),
      with: {
        items: true,
        table: true,
      },
    });

    console.log(`✅ Encontradas ${paidOrders.length} órdenes pagadas de hoy`);

    let migrated = 0;
    let skipped = 0;

    for (const order of paidOrders) {
      try {
        // Verificar si ya existe en sales_history
        const existing = await db.query.salesHistory.findFirst({
          where: eq(salesHistory.orderId, order.id),
        });

        if (existing) {
          console.log(`⏭️  Orden ${order.orderNumber} ya existe en sales_history`);
          skipped++;
          continue;
        }

        // Insertar en sales_history
        await db.insert(salesHistory).values({
          orderId: order.id,
          orderNumber: order.orderNumber,
          cashRegisterId: order.cashRegisterId!,
          tableId: order.tableId,
          tableNumber: order.table?.number,
          customerName: order.customerName,
          paymentMethod: order.paymentMethod!,
          subtotal: order.subtotal,
          tip: order.tip,
          total: order.total,
          discount: order.discountAmount || "0",
          discountName: order.discountName,
          itemsJson: JSON.stringify(order.items || []),
          userId: order.userId,
          loyaltyCardId: order.loyaltyCardId,
          splitBillData: order.splitBillData,
          createdAt: order.createdAt,
          paidAt: order.updatedAt, // Usamos updatedAt como fecha de pago
        });

        console.log(`✅ Migrada orden ${order.orderNumber} (${order.total})`);
        migrated++;
      } catch (error) {
        console.error(`❌ Error migrando orden ${order.orderNumber}:`, error);
      }
    }

    console.log("\n📊 Resumen de migración:");
    console.log(`  ✅ Migradas: ${migrated}`);
    console.log(`  ⏭️  Omitidas (ya existían): ${skipped}`);
    console.log(`  📦 Total procesadas: ${paidOrders.length}`);

  } catch (error) {
    console.error("❌ Error en migración:", error);
    throw error;
  }
}

// Ejecutar migración
migrateSalesToHistory()
  .then(() => {
    console.log("\n✅ Migración completada exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migración falló:", error);
    process.exit(1);
  });
