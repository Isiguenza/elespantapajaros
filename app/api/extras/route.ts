import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extras } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const results = await db.query.extras.findMany({
      where: activeOnly ? eq(extras.active, true) : undefined,
      orderBy: (extras, { asc }) => [asc(extras.sortOrder), asc(extras.name)],
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching extras:", error);
    return NextResponse.json({ error: "Error obteniendo extras" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    if (price === undefined || price < 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
    }

    const [extra] = await db
      .insert(extras)
      .values({
        name,
        description: description || null,
        price: price.toString(),
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(extra);
  } catch (error) {
    console.error("Error creating extra:", error);
    return NextResponse.json({ error: "Error creando extra" }, { status: 500 });
  }
}
