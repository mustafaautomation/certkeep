import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, signSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const redirect = NextResponse.redirect(new URL("/demo", request.url), 303);
  redirect.cookies.set(SESSION_COOKIE, signSession({
    userId: "user_demo",
    orgId: "org_harbor",
    readOnly: true,
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return redirect;
}
