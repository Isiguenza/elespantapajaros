import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingredients } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.query.ingredients.findMany({
      orderBy: [desc(ingredients.createdAt)],
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, unit, currentStock, minStock, costPerUnit, active } = body;

    if (!name || !unit) {
      return NextResponse.json(
        { error: "Name and unit are required" },
        { status: 400 }
      );
    }

    const [ingredient] = await db
      .insert(ingredients)
      .values({
        name,
        unit,
        currentStock: currentStock || "0",
        minStock: minStock || "0",
        costPerUnit: costPerUnit || "0",
        active: active ?? true,
      })
      .returning();

    return NextResponse.json(ingredient, { status: 201 });
  } catch (error) {
    console.error("Error creating ingredient:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
