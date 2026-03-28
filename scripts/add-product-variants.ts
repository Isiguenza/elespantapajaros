import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en .env");
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("🔧 Agregando columnas de variantes a productos...");

  try {
    // Agregar columna has_variants
    console.log("1️⃣ Agregando columna has_variants...");
    await sql`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "has_variants" boolean NOT NULL DEFAULT false;
    `;
    console.log("✅ Columna has_variants agregada");

    // Agregar columna variants (JSON como text)
    console.log("2️⃣ Agregando columna variants...");
    await sql`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "variants" text;
    `;
    console.log("✅ Columna variants agregada");

    console.log("\n🎉 Migración completada!");
    console.log("Ahora los productos pueden tener variantes de precio.");
    console.log("Ejemplo: Pieza/Orden, Mediano/Grande, etc.");
  } catch (error) {
    console.error("❌ Error en migración:", error);
    process.exit(1);
  }
}

main();
