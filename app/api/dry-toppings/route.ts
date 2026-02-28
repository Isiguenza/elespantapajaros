import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dryToppings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const results = await db.query.dryToppings.findMany({
      where: activeOnly ? eq(dryToppings.active, true) : undefined,
      orderBy: (dryToppings, { asc }) => [asc(dryToppings.sortOrder), asc(dryToppings.name)],
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching dry toppings:", error);
    return NextResponse.json({ error: "Error obteniendo escarchados secos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const [dryTopping] = await db
      .insert(dryToppings)
      .values({
        name,
        description: description || null,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(dryTopping);
  } catch (error) {
    console.error("Error creating dry topping:", error);
    return NextResponse.json({ error: "Error creando escarchado seco" }, { status: 500 });
  }
}
