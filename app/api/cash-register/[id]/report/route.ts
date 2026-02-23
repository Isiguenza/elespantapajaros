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

    const withdrawals = register.transactions
      .filter(t => t.type === "withdrawal")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const deposits = register.transactions
      .filter(t => t.type === "deposit")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const refunds = register.transactions
      .filter(t => t.type === "refund")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalSales = cashSales + terminalSales + transferSales;
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
        
        withdrawals,
        deposits,
        refunds,
        
        totalOrders: register.totalOrders || 0,
        
        vouchersTotal: register.vouchersTotal ? parseFloat(register.vouchersTotal) : 0,
        receiptsTotal: register.receiptsTotal ? parseFloat(register.receiptsTotal) : 0,
      },
      transactions: register.transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        paymentMethod: t.paymentMethod,
        description: t.description,
        createdAt: t.createdAt,
        userId: t.userId,
        orderId: t.orderId,
      })),
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
