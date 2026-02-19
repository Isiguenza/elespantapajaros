import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mercadopagoDevices } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const devices = await db.query.mercadopagoDevices.findMany({
      orderBy: [desc(mercadopagoDevices.createdAt)],
    });
    return NextResponse.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, name, operatingMode } = body;

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    const [device] = await db
      .insert(mercadopagoDevices)
      .values({
        deviceId,
        deviceName: name || deviceId,
        posId: body.posId || null,
        storeId: body.storeId || null,
        active: true,
      })
      .returning();

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error("Error creating device:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
