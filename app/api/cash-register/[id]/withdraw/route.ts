import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cashRegisters, cashRegisterTransactions, auditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, userId, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a cero" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Se requiere identificación del empleado" },
        { status: 400 }
      );
    }

    // Get register
    const register = await db.query.cashRegisters.findFirst({
      where: eq(cashRegisters.id, id),
    });

    if (!register) {
      return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
    }

    if (register.status !== "open") {
      return NextResponse.json(
        { error: "La caja debe estar abierta para hacer retiros" },
        { status: 400 }
      );
    }

    // Create withdrawal transaction
    const [transaction] = await db
      .insert(cashRegisterTransactions)
      .values({
        registerId: id,
        type: "withdrawal",
        amount: amount.toFixed(2),
        paymentMethod: "cash",
        userId,
        description: description || "Sangría de caja",
      })
      .returning();

    // Update register withdrawals total
    const currentWithdrawals = parseFloat(register.withdrawals || "0");
    await db
      .update(cashRegisters)
      .set({
        withdrawals: (currentWithdrawals + amount).toFixed(2),
      })
      .where(eq(cashRegisters.id, id));

    // Create audit log
    await db.insert(auditLog).values({
      action: "cash_withdrawal",
      entityType: "cash_register",
      entityId: id,
      userId,
      details: JSON.stringify({
        amount: amount.toFixed(2),
        description: description || "Sangría de caja",
        transactionId: transaction.id,
      }),
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    return NextResponse.json(
      { error: "Error registrando retiro" },
      { status: 500 }
    );
  }
}
