import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: { category: true, ingredients: { with: { ingredient: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, categoryId, imageUrl, hasVariants, variants, active } = body;

    const [product] = await db
      .update(products)
      .set({
        name,
        description: description || null,
        price: price || "0",
        categoryId: categoryId || null,
        imageUrl: imageUrl || null,
        hasVariants: hasVariants ?? false,
        variants: variants || null,
        active,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🗑️ DELETE handler iniciado");
  
  try {
    console.log("🔍 Obteniendo params...");
    const { id } = await params;
    console.log("🗑️ ID a eliminar:", id);
    
    // Verificar si el producto existe y su estado
    const [product] = await db.select().from(products).where(eq(products.id, id));
    
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    
    console.log("📦 Producto encontrado, activo:", product.active);
    
    // Si el producto está inactivo, permitir eliminación forzada
    if (!product.active) {
      console.log("🗑️ Producto inactivo - eliminando sin verificar órdenes...");
      await db.delete(products).where(eq(products.id, id));
      console.log("✅ Producto inactivo eliminado exitosamente");
      return NextResponse.json({ success: true });
    }
    
    // Si está activo, intentar eliminar normalmente (fallará si tiene órdenes)
    console.log("🗑️ Producto activo - ejecutando delete en DB...");
    await db.delete(products).where(eq(products.id, id));
    
    console.log("✅ Producto eliminado exitosamente");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ ERROR COMPLETO:", error);
    console.error("❌ Error cause:", error.cause);
    
    // Detectar error de foreign key constraint - el código está en error.cause.code
    const errorCode = error.cause?.code || error.code;
    const errorMessage = error.cause?.message || error.message;
    
    if (errorCode === '23503' || errorMessage?.includes('foreign key') || errorMessage?.includes('violates')) {
      return NextResponse.json({ 
        error: "No se puede eliminar este producto activo porque tiene órdenes asociadas. Desactívalo primero." 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: errorMessage || "Error al eliminar producto" 
    }, { status: 500 });
  }
}
