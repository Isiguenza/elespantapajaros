import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cashRegisters, auditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const register = await db.query.cashRegisters.findFirst({
      where: eq(cashRegisters.id, id),
      with: {
        transactions: {
          orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
        },
      },
    });

    if (!register) {
      return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
    }

    if (register.status !== "open") {
      return NextResponse.json(
        { error: "Solo se puede hacer corte parcial de caja abierta" },
        { status: 400 }
      );
    }

    // Calculate current totals
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

    const totalSales = cashSales + terminalSales + transferSales;
    const expectedCash = parseFloat(register.initialCash) + cashSales - withdrawals + deposits;

    const report = {
      timestamp: new Date(),
      registerId: id,
      openedAt: register.openedAt,
      hoursSinceOpen: (Date.now() - new Date(register.openedAt).getTime()) / (1000 * 60 * 60),
      
      cash: {
        initial: parseFloat(register.initialCash),
        sales: cashSales,
        withdrawals,
        deposits,
        expected: expectedCash,
      },
      
      sales: {
        total: totalSales,
        cash: cashSales,
        terminal: terminalSales,
        transfer: transferSales,
      },
      
      transactions: {
        total: register.transactions.length,
        byType: {
          sales: register.transactions.filter(t => t.type === "sale").length,
          withdrawals: register.transactions.filter(t => t.type === "withdrawal").length,
          deposits: register.transactions.filter(t => t.type === "deposit").length,
          refunds: register.transactions.filter(t => t.type === "refund").length,
        },
      },
      
      recentTransactions: register.transactions.slice(0, 10),
    };

    // Log partial report access
    if (userId) {
      await db.insert(auditLog).values({
        action: "partial_report_viewed",
        entityType: "cash_register",
        entityId: id,
        userId,
        details: JSON.stringify({
          timestamp: report.timestamp,
          totalSales: totalSales.toFixed(2),
          expectedCash: expectedCash.toFixed(2),
        }),
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating partial report:", error);
    return NextResponse.json(
      { error: "Error generando corte parcial" },
      { status: 500 }
    );
  }
}
