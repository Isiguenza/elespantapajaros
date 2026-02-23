import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const employees = await db.query.userProfiles.findMany({
      orderBy: (userProfiles, { asc }) => [asc(userProfiles.name)],
    });

    // Don't return pinHash
    const sanitized = employees.map(({ pinHash, ...emp }) => emp);

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ error: "Error fetching employees" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, pin, employeeCode } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email and role are required" },
        { status: 400 }
      );
    }

    if (pin && pin.length !== 4) {
      return NextResponse.json(
        { error: "PIN must be 4 digits" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.email, email),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash PIN if provided
    let pinHash = null;
    if (pin) {
      pinHash = await bcrypt.hash(pin, 10);
    }

    // For employees created directly (not via auth), use email as authUserId
    const [employee] = await db
      .insert(userProfiles)
      .values({
        name,
        email,
        role,
        pinHash,
        employeeCode: employeeCode || null,
        authUserId: `employee_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        active: true,
      })
      .returning();

    // Don't return pinHash
    const { pinHash: _, ...sanitized } = employee;

    return NextResponse.json(sanitized, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Error creating employee" }, { status: 500 });
  }
}
