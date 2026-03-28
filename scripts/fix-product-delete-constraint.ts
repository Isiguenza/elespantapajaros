import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en .env");
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("🔧 Modificando constraint de productos para permitir eliminación...");

  try {
    // 1. Eliminar el constraint existente
    console.log("1️⃣ Eliminando constraint existente...");
    await sql`
      ALTER TABLE "order_items" 
      DROP CONSTRAINT IF EXISTS "order_items_product_id_products_id_fk";
    `;
    console.log("✅ Constraint eliminado");

    // 2. Agregar nuevo constraint con ON DELETE SET NULL
    // Esto permitirá eliminar productos, y los order_items mantendrán el productName pero productId será null
    console.log("2️⃣ Agregando nuevo constraint con ON DELETE SET NULL...");
    await sql`
      ALTER TABLE "order_items" 
      ADD CONSTRAINT "order_items_product_id_products_id_fk" 
      FOREIGN KEY ("product_id") 
      REFERENCES "products"("id") 
      ON DELETE SET NULL;
    `;
    console.log("✅ Nuevo constraint agregado");

    console.log("\n🎉 Migración completada!");
    console.log("Ahora puedes eliminar productos inactivos aunque tengan órdenes asociadas.");
    console.log("Los order_items mantendrán el nombre del producto pero el ID será null.");
  } catch (error) {
    console.error("❌ Error en migración:", error);
    process.exit(1);
  }
}

main();
