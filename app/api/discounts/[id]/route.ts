import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/discounts/[id] - Get a single discount
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const [discount] = await db
      .select()
      .from(discounts)
      .where(eq(discounts.id, id));

    if (!discount) {
      return NextResponse.json(
        { error: "Descuento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(discount);
  } catch (error) {
    console.error("Error fetching discount:", error);
    return NextResponse.json(
      { error: "Error al obtener descuento" },
      { status: 500 }
    );
  }
}

// PATCH /api/discounts/[id] - Update a discount
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) {
      updateData.type = body.type;
      // If changing to flexible, set value to 0
      if (body.type === "flexible") {
        updateData.value = "0";
      }
    }
    if (body.value !== undefined && body.type !== "flexible") {
      updateData.value = body.value.toString();
    }
    if (body.requiresAuthorization !== undefined) 
      updateData.requiresAuthorization = body.requiresAuthorization;
    if (body.active !== undefined) updateData.active = body.active;

    const [updatedDiscount] = await db
      .update(discounts)
      .set(updateData)
      .where(eq(discounts.id, id))
      .returning();

    if (!updatedDiscount) {
      return NextResponse.json(
        { error: "Descuento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedDiscount);
  } catch (error) {
    console.error("Error updating discount:", error);
    return NextResponse.json(
      { error: "Error al actualizar descuento" },
      { status: 500 }
    );
  }
}

// DELETE /api/discounts/[id] - Delete a discount
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const [deletedDiscount] = await db
      .delete(discounts)
      .where(eq(discounts.id, id))
      .returning();

    if (!deletedDiscount) {
      return NextResponse.json(
        { error: "Descuento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting discount:", error);
    return NextResponse.json(
      { error: "Error al eliminar descuento" },
      { status: 500 }
    );
  }
}
