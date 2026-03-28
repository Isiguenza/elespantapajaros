import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

// Cargar variables de entorno
config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en .env");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function main() {
  console.log("🚀 Aplicando migración de mesas...");

  try {
    // Crear enum table_status si no existe
    await sql`
      DO $$ BEGIN
        CREATE TYPE "public"."table_status" AS ENUM('available', 'occupied', 'reserved');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log("✅ Enum table_status creado/verificado");

    // Crear tabla tables
    await sql`
      CREATE TABLE IF NOT EXISTS "tables" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "number" varchar(50) NOT NULL,
        "name" varchar(255),
        "capacity" integer DEFAULT 4 NOT NULL,
        "status" "table_status" DEFAULT 'available' NOT NULL,
        "active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "tables_number_unique" UNIQUE("number")
      );
    `;
    console.log("✅ Tabla tables creada");

    // Agregar columna table_id a orders si no existe
    await sql`
      DO $$ BEGIN
        ALTER TABLE "orders" ADD COLUMN "table_id" uuid;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `;
    console.log("✅ Columna table_id agregada a orders");

    // Agregar foreign key si no existe
    await sql`
      DO $$ BEGIN
        ALTER TABLE "orders" 
        ADD CONSTRAINT "orders_table_id_tables_id_fk" 
        FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") 
        ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log("✅ Foreign key agregada");

    console.log("\n🎉 Migración completada exitosamente!");
  } catch (error) {
    console.error("❌ Error en migración:", error);
    process.exit(1);
  }
}

main();
