import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tables } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allTables = await db.query.tables.findMany({
      where: eq(tables.active, true),
      orderBy: (tables, { asc }) => [asc(tables.number)],
    });

    return NextResponse.json(allTables);
  } catch (error) {
    console.error("Error fetching table layout:", error);
    return NextResponse.json(
      { error: "Error fetching table layout" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tables: updatedTables } = body;

    if (!Array.isArray(updatedTables)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Update each table's layout properties
    for (const table of updatedTables) {
      await db
        .update(tables)
        .set({
          positionX: table.positionX,
          positionY: table.positionY,
          shape: table.shape,
          rotation: table.rotation,
          updatedAt: new Date(),
        })
        .where(eq(tables.id, table.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating table layout:", error);
    return NextResponse.json(
      { error: "Error updating table layout" },
      { status: 500 }
    );
  }
}
