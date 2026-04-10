import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    console.log("Adding platform_price column to products table...");
    
    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS platform_price NUMERIC(10, 2);
    `);
    
    await db.execute(sql`
      COMMENT ON COLUMN products.platform_price IS 'Precio especial para plataformas de delivery (Uber/Rappi/Didi). Si es NULL, usa el precio normal.';
    `);
    
    console.log("✅ Successfully added platform_price column!");
    
    return NextResponse.json({ 
      success: true, 
      message: "Column platform_price added successfully" 
    });
  } catch (error: any) {
    console.error("❌ Error adding platform_price column:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
