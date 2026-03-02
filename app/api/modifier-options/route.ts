import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { modifierOptions } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stepId, name, description, price, sortOrder } = body;

    if (!stepId || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [option] = await db
      .insert(modifierOptions)
      .values({
        stepId,
        name,
        description: description || null,
        price: price || "0",
        sortOrder: sortOrder || 0,
        active: true,
      })
      .returning();

    return NextResponse.json(option, { status: 201 });
  } catch (error) {
    console.error("Error creating modifier option:", error);
    return NextResponse.json(
      { error: "Error creating modifier option" },
      { status: 500 }
    );
  }
}
