import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Delete auth cookie
  response.cookies.delete("auth_token");
  
  return response;
}
