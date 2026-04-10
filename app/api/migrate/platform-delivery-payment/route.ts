import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    console.log("Adding 'platform_delivery' to payment_method enum...");
    
    await db.execute(sql`
      ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'platform_delivery';
    `);
    
    console.log("✅ Successfully added 'platform_delivery' to payment_method enum!");
    
    return NextResponse.json({ 
      success: true, 
      message: "Value 'platform_delivery' added to payment_method enum successfully" 
    });
  } catch (error: any) {
    console.error("❌ Error adding value to enum:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
