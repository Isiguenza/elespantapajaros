import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("auth_token");
    
    if (!authCookie) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Verify JWT
    const { payload } = await jwtVerify(authCookie.value, JWT_SECRET);
    
    return NextResponse.json({
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      employeeCode: payload.employeeCode,
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    );
  }
}
