import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function addPlatformPriceColumn() {
  try {
    console.log("Adding platform_price column to products table...");
    
    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS platform_price NUMERIC(10, 2);
    `);
    
    await db.execute(sql`
      COMMENT ON COLUMN products.platform_price IS 'Precio especial para plataformas de delivery (Uber/Rappi/Didi). Si es NULL, usa el precio normal.';
    `);
    
    console.log("✅ Successfully added platform_price column!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding platform_price column:", error);
    process.exit(1);
  }
}

addPlatformPriceColumn();
