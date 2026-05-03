import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, pin } = body;

    if (!pin) {
      return NextResponse.json(
        { error: "PIN is required" },
        { status: 400 }
      );
    }

    if (pin.length !== 4) {
      return NextResponse.json(
        { error: "PIN must be 4 digits" },
        { status: 400 }
      );
    }

    // If identifier is provided (backward compatibility), use old logic
    if (identifier) {
      const employee = await db.query.userProfiles.findFirst({
        where: or(
          eq(userProfiles.email, identifier),
          eq(userProfiles.employeeCode, identifier)
        ),
      });

      if (!employee) {
        return NextResponse.json(
          { error: "Employee not found" },
          { status: 404 }
        );
      }

      if (!employee.active) {
        return NextResponse.json(
          { error: "Employee is not active" },
          { status: 403 }
        );
      }

      if (!employee.pinHash) {
        return NextResponse.json(
          { error: "Employee does not have a PIN set" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(pin, employee.pinHash);

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid PIN" },
          { status: 401 }
        );
      }

      // Create JWT token valid for 30 minutes
      const token = await new SignJWT({
        userId: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30m")
        .setIssuedAt()
        .sign(JWT_SECRET);

      return NextResponse.json({
        success: true,
        token,
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          employeeCode: employee.employeeCode,
        },
      });
    }

    // New logic: Find employee by PIN only
    const allEmployees = await db.query.userProfiles.findMany({
      where: eq(userProfiles.active, true),
    });

    // Check PIN against all active employees
    let matchedEmployee = null;
    for (const emp of allEmployees) {
      if (emp.pinHash) {
        const isValid = await bcrypt.compare(pin, emp.pinHash);
        if (isValid) {
          matchedEmployee = emp;
          break;
        }
      }
    }

    if (!matchedEmployee) {
      return NextResponse.json(
        { error: "PIN incorrecto" },
        { status: 401 }
      );
    }

    // Create JWT token valid for 30 minutes
    const token = await new SignJWT({
      userId: matchedEmployee.id,
      name: matchedEmployee.name,
      email: matchedEmployee.email,
      role: matchedEmployee.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30m")
      .setIssuedAt()
      .sign(JWT_SECRET);

    return NextResponse.json({
      success: true,
      token,
      employee: {
        id: matchedEmployee.id,
        name: matchedEmployee.name,
        email: matchedEmployee.email,
        role: matchedEmployee.role,
        employeeCode: matchedEmployee.employeeCode,
      },
    });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return NextResponse.json(
      { error: "Error verifying PIN" },
      { status: 500 }
    );
  }
}
