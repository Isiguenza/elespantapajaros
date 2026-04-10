import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cashRegisters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const register = await db.query.cashRegisters.findFirst({
      where: eq(cashRegisters.id, id),
      with: {
        transactions: {
          orderBy: (transactions, { asc }) => [asc(transactions.createdAt)],
        },
      },
    });

    if (!register) {
      return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
    }

    // Calculate detailed report
    const cashSales = register.transactions
      .filter(t => t.type === "sale" && t.paymentMethod === "cash")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const terminalSales = register.transactions
      .filter(t => t.type === "sale" && t.paymentMethod === "terminal_mercadopago")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const transferSales = register.transactions
      .filter(t => t.type === "sale" && t.paymentMethod === "transfer")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // Platform delivery sales (con descuento del 27%)
    const platformDeliverySales = register.transactions
      .filter(t => t.type === "sale" && t.paymentMethod === "platform_delivery")
      .reduce((sum, t) => sum + (parseFloat(t.amount) * 0.73), 0);

    const withdrawals = register.transactions
      .filter(t => t.type === "withdrawal")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const deposits = register.transactions
      .filter(t => t.type === "deposit")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const refunds = register.transactions
      .filter(t => t.type === "refund")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalSales = cashSales + terminalSales + transferSales + platformDeliverySales;
    const expectedCash = parseFloat(register.initialCash) + cashSales - withdrawals + deposits - refunds;

    const report = {
      register: {
        id: register.id,
        openedAt: register.openedAt,
        closedAt: register.closedAt,
        status: register.status,
        openedBy: register.openedBy,
        closedBy: register.closedBy,
      },
      summary: {
        initialCash: parseFloat(register.initialCash),
        finalCash: register.finalCash ? parseFloat(register.finalCash) : null,
        expectedCash,
        difference: register.difference ? parseFloat(register.difference) : null,
        
        totalSales,
        cashSales,
        terminalSales,
        transferSales,
        platformDeliverySales,
        
        withdrawals,
        deposits,
        refunds,
        
        totalOrders: register.totalOrders || 0,
        
        vouchersTotal: register.vouchersTotal ? parseFloat(register.vouchersTotal) : 0,
        receiptsTotal: register.receiptsTotal ? parseFloat(register.receiptsTotal) : 0,
      },
      transactions: register.transactions.map(t => {
        // Aplicar descuento del 27% a transacciones de platform_delivery
        const isPlatformDelivery = t.paymentMethod === 'platform_delivery';
        const originalAmount = parseFloat(t.amount);
        const commission = isPlatformDelivery ? originalAmount * 0.27 : 0;
        const amountAfterCommission = isPlatformDelivery ? originalAmount * 0.73 : originalAmount;
        
        return {
          id: t.id,
          type: t.type,
          amount: amountAfterCommission,
          originalAmount: isPlatformDelivery ? originalAmount : undefined,
          platformCommission: isPlatformDelivery ? commission : undefined,
          paymentMethod: t.paymentMethod,
          description: isPlatformDelivery 
            ? `${t.description} (Comisión 27%: -$${commission.toFixed(2)})`
            : t.description,
          createdAt: t.createdAt,
          userId: t.userId,
          orderId: t.orderId,
        };
      }),
      notes: {
        opening: register.notes,
        closure: register.closureNotes,
      },
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Error generando reporte" },
      { status: 500 }
    );
  }
}
