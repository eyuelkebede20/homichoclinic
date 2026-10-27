import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectTarget = new URL("/login?reset=done", url.origin);
  const response = NextResponse.redirect(redirectTarget);

  for (const cookieName of AUTH_COOKIES) {
    response.cookies.set(cookieName, "", {
      path: "/",
      expires: new Date(0),
      maxAge: 0,
      sameSite: "lax",
    });
  }

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

export async function POST(request: Request) {
  return GET(request);
}
