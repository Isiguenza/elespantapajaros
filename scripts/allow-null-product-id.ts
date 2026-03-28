import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en .env");
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("🔧 Modificando columna product_id para permitir NULL...");

  try {
    // Modificar la columna product_id para permitir NULL
    console.log("1️⃣ Cambiando product_id a nullable...");
    await sql`
      ALTER TABLE "order_items" 
      ALTER COLUMN "product_id" DROP NOT NULL;
    `;
    console.log("✅ Columna product_id ahora permite NULL");

    console.log("\n🎉 Migración completada!");
    console.log("Ahora puedes eliminar productos y los order_items tendrán product_id = null");
    console.log("pero mantendrán el product_name para el historial.");
  } catch (error) {
    console.error("❌ Error en migración:", error);
    process.exit(1);
  }
}

main();
