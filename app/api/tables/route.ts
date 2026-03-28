import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tables } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/tables - Obtener todas las mesas
export async function GET() {
  try {
    const allTables = await db
      .select()
      .from(tables)
      .where(eq(tables.active, true))
      .orderBy(tables.number);

    return NextResponse.json(allTables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Error al obtener mesas" },
      { status: 500 }
    );
  }
}

// POST /api/tables - Crear nueva mesa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { number, name, capacity } = body;

    if (!number) {
      return NextResponse.json(
        { error: "El número de mesa es requerido" },
        { status: 400 }
      );
    }

    const [newTable] = await db
      .insert(tables)
      .values({
        number,
        name: name || null,
        capacity: capacity || 4,
        status: "available",
        active: true,
      })
      .returning();

    return NextResponse.json(newTable, { status: 201 });
  } catch (error: any) {
    console.error("Error creating table:", error);
    
    // Verificar código de error (puede estar en error.code o error.cause.code)
    const errorCode = error.code || error.cause?.code;
    
    if (errorCode === "23505") {
      return NextResponse.json(
        { error: "Ya existe una mesa con ese número" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear mesa" },
      { status: 500 }
    );
  }
}
