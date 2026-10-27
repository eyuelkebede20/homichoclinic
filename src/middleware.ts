import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIES = [
  "clinic_v2.session_token",
  "clinic_v2.session_data",
  "clinic_v2.dont_remember",
  "clinic_v2.csrf_token",
  "better-auth.session_token",
  "better-auth.session_data",
  "better-auth.dont_remember",
  "better-auth.csrf_token",
];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Check if user or system requested a reset via ?reset=... or path /reset
  const hasResetParam = searchParams.has("reset");
  const isResetPath = pathname === "/reset" || pathname === "/api/auth/reset";

  // 2. Check for hard refresh (Ctrl + F5 or Shift + Reload sends Cache-Control: no-cache or Pragma: no-cache)
  const cacheControl = request.headers.get("cache-control") || "";
  const pragma = request.headers.get("pragma") || "";
  const isHardRefresh = cacheControl.includes("no-cache") || pragma.includes("no-cache");

  // If a hard refresh happens on /login, or an explicit reset is triggered, wipe the cookies
  const shouldClearCookies = hasResetParam || isResetPath || (isHardRefresh && pathname === "/login");

  if (shouldClearCookies) {
    let response: NextResponse;

    if (isResetPath) {
      // Redirect to /login with confirmation
      response = NextResponse.redirect(new URL("/login?reset=done", request.url));
    } else {
      response = NextResponse.next();
    }

    // Proactively clear all auth cookies
    for (const cookieName of AUTH_COOKIES) {
      response.cookies.set(cookieName, "", {
        path: "/",
        expires: new Date(0),
        maxAge: 0,
        sameSite: "lax",
      });
    }

    // Prevent caching of this response so stale cookie states never persist
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
