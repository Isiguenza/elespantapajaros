import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promotions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/promotions/active - Get active promotions (with date/time validation)
export async function GET(request: NextRequest) {
  try {
    // Get all active promotions
    const allPromotions = await db
      .select()
      .from(promotions)
      .where(eq(promotions.active, true));

    console.log('📋 Total promociones con active=true:', allPromotions.length);
    console.log('📋 Promociones:', allPromotions.map(p => ({ id: p.id, name: p.name, active: p.active, startDate: p.startDate, endDate: p.endDate })));

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    console.log('🕐 Fecha/hora actual:', { currentDate, currentTime, currentDay });

    // Filter promotions based on date/time restrictions
    const activePromotions = allPromotions.filter((promo) => {
      console.log(`\n🔍 Evaluando promo "${promo.name}":`);
      
      // Check date range
      if (promo.startDate && currentDate < promo.startDate) {
        console.log(`  ❌ Rechazada: currentDate (${currentDate}) < startDate (${promo.startDate})`);
        return false;
      }
      if (promo.endDate && currentDate > promo.endDate) {
        console.log(`  ❌ Rechazada: currentDate (${currentDate}) > endDate (${promo.endDate})`);
        return false;
      }
      console.log(`  ✅ Fechas OK`);

      // Check days of week
      if (promo.daysOfWeek) {
        try {
          const allowedDays = JSON.parse(promo.daysOfWeek);
          console.log(`  📅 daysOfWeek: ${promo.daysOfWeek}, parsed:`, allowedDays, `currentDay: ${currentDay}`);
          if (Array.isArray(allowedDays) && allowedDays.length > 0 && !allowedDays.includes(currentDay)) {
            console.log(`  ❌ Rechazada: día ${currentDay} no está en`, allowedDays);
            return false;
          }
          console.log(`  ✅ Días OK`);
        } catch (e) {
          console.error("Error parsing daysOfWeek:", e);
        }
      }

      // Check time range
      if (promo.startTime && currentTime < promo.startTime) {
        console.log(`  ❌ Rechazada: currentTime (${currentTime}) < startTime (${promo.startTime})`);
        return false;
      }
      if (promo.endTime && currentTime > promo.endTime) {
        console.log(`  ❌ Rechazada: currentTime (${currentTime}) > endTime (${promo.endTime})`);
        return false;
      }
      console.log(`  ✅ Horario OK`);

      console.log(`  ✅✅✅ PROMOCIÓN ACEPTADA!`);
      return true;
    });

    console.log('\n🎉 Total promociones activas después de filtros:', activePromotions.length);

    // Sort by priority (higher priority first)
    activePromotions.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return NextResponse.json(activePromotions);
  } catch (error) {
    console.error("Error fetching active promotions:", error);
    return NextResponse.json(
      { error: "Error al obtener promociones activas" },
      { status: 500 }
    );
  }
}
