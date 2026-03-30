import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tables, orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/tables/[id] - Obtener mesa específica con orden activa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [table] = await db
      .select()
      .from(tables)
      .where(eq(tables.id, id));

    if (!table) {
      return NextResponse.json(
        { error: "Mesa no encontrada" },
        { status: 404 }
      );
    }

    // Buscar orden activa (pending o preparing) para esta mesa
    const [activeOrder] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tableId, id),
          eq(orders.paymentStatus, "pending")
        )
      )
      .orderBy(orders.createdAt)
      .limit(1);

    return NextResponse.json({
      ...table,
      activeOrder: activeOrder || null,
    });
  } catch (error) {
    console.error("Error fetching table:", error);
    return NextResponse.json(
      { error: "Error al obtener mesa" },
      { status: 500 }
    );
  }
}

// PUT /api/tables/[id] - Actualizar mesa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { number, name, capacity, status, active, guestCount } = body;

    const [updatedTable] = await db
      .update(tables)
      .set({
        ...(number !== undefined && { number }),
        ...(name !== undefined && { name }),
        ...(capacity !== undefined && { capacity }),
        ...(status !== undefined && { status }),
        ...(active !== undefined && { active }),
        ...(guestCount !== undefined && { guestCount }),
        updatedAt: new Date(),
      })
      .where(eq(tables.id, id))
      .returning();

    if (!updatedTable) {
      return NextResponse.json(
        { error: "Mesa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTable);
  } catch (error: any) {
    console.error("Error updating table:", error);

    // Verificar código de error (puede estar en error.code o error.cause.code)
    const errorCode = error.code || error.cause?.code;

    if (errorCode === "23505") {
      return NextResponse.json(
        { error: "Ya existe una mesa con ese número" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar mesa" },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id] - Eliminar mesa (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar si hay órdenes activas
    const [activeOrder] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tableId, id),
          eq(orders.paymentStatus, "pending")
        )
      )
      .limit(1);

    if (activeOrder) {
      return NextResponse.json(
        { error: "No se puede eliminar una mesa con cuenta abierta" },
        { status: 400 }
      );
    }

    // Hard delete - eliminar completamente la mesa
    await db.delete(tables).where(eq(tables.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { error: "Error al eliminar mesa" },
      { status: 500 }
    );
  }
}
