import { getAuth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/loyalty/register"];

export default function proxy(request: NextRequest) {
  // Allow public paths through without auth
  if (PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  try {
    const auth = getAuth();
    const mw = auth.middleware({
      loginUrl: "/auth/sign-in",
    });
    return mw(request);
  } catch {
    // If auth is not configured, allow request through
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/inventory/:path*",
    "/cash-register/:path*",
    "/loyalty/:path*",
    "/account/:path*",
    "/settings/:path*",
  ],
};
