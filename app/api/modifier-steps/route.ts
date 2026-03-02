import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { modifierSteps } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, stepType, stepName, sortOrder, isRequired, allowMultiple } = body;

    if (!categoryId || !stepType || !stepName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [step] = await db
      .insert(modifierSteps)
      .values({
        categoryId,
        stepType,
        stepName,
        sortOrder: sortOrder || 0,
        isRequired: isRequired || false,
        allowMultiple: allowMultiple || false,
        active: true,
      })
      .returning();

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error("Error creating modifier step:", error);
    return NextResponse.json(
      { error: "Error creating modifier step" },
      { status: 500 }
    );
  }
}
