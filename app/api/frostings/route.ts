import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { frostings } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const result = await db.query.frostings.findMany({
      where: activeOnly ? eq(frostings.active, true) : undefined,
      orderBy: [asc(frostings.sortOrder), asc(frostings.name)],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching frostings:", error);
    return NextResponse.json({ error: "Error fetching frostings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, sortOrder } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const [frosting] = await db
      .insert(frostings)
      .values({
        name,
        description: description || null,
        sortOrder: sortOrder || 0,
        active: true,
      })
      .returning();

    return NextResponse.json(frosting, { status: 201 });
  } catch (error) {
    console.error("Error creating frosting:", error);
    return NextResponse.json({ error: "Error creating frosting" }, { status: 500 });
  }
}
