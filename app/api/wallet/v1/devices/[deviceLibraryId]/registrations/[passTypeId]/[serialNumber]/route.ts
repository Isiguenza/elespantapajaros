import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { walletDeviceRegistrations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// Register a device for push notifications for a pass
export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      deviceLibraryId: string;
      passTypeId: string;
      serialNumber: string;
    }>;
  }
) {
  const { deviceLibraryId, passTypeId, serialNumber } = await params;

  // Verify auth token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("ApplePass ")) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const body = await request.json();
    const pushToken = body?.pushToken || null;

    // Check if already registered
    const existing = await db.query.walletDeviceRegistrations.findFirst({
      where: and(
        eq(walletDeviceRegistrations.deviceLibraryId, deviceLibraryId),
        eq(walletDeviceRegistrations.serialNumber, serialNumber)
      ),
    });

    if (existing) {
      // Already registered — 200
      return new NextResponse(null, { status: 200 });
    }

    await db.insert(walletDeviceRegistrations).values({
      deviceLibraryId,
      passTypeId,
      serialNumber,
      pushToken,
    });

    // New registration — 201
    return new NextResponse(null, { status: 201 });
  } catch (error) {
    console.error("Error registering device:", error);
    return new NextResponse(null, { status: 500 });
  }
}

// Unregister a device
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      deviceLibraryId: string;
      passTypeId: string;
      serialNumber: string;
    }>;
  }
) {
  const { deviceLibraryId, serialNumber } = await params;

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("ApplePass ")) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    await db
      .delete(walletDeviceRegistrations)
      .where(
        and(
          eq(walletDeviceRegistrations.deviceLibraryId, deviceLibraryId),
          eq(walletDeviceRegistrations.serialNumber, serialNumber)
        )
      );
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error unregistering device:", error);
    return new NextResponse(null, { status: 500 });
  }
}
