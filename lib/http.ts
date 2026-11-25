import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, signSession, verifySession } from "@/lib/session";
import type { SessionClaims } from "@/lib/types";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Something went wrong." }, { status: 500 });
}

function secureCookie(request: Request) {
  return new URL(request.url).protocol === "https:";
}

export function jsonWithSession(data: unknown, claims: SessionClaims, request: Request, status = 200) {
  const response = NextResponse.json(data, { status });
  response.cookies.set(SESSION_COOKIE, signSession(claims), {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(request),
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export function clearSession(data: unknown, request: Request) {
  const response = NextResponse.json(data);
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(request),
    path: "/",
    maxAge: 0,
  });
  return response;
}

export function readRequestSession(request: NextRequest) {
  return verifySession(request.cookies.get(SESSION_COOKIE)?.value);
}

export function decodeBase64File(input: unknown) {
  if (typeof input !== "string" || input.trim().length === 0) return null;
  const cleaned = input.replace(/^data:[^,]*,/, "").trim();
  if (cleaned.length > 2_200_000) {
    throw new HttpError(413, "File is too large. The limit is 1.5 MB.");
  }
  const buffer = Buffer.from(cleaned, "base64");
  if (buffer.length === 0 || buffer.length > 1_500_000) {
    throw new HttpError(413, "File is too large. The limit is 1.5 MB.");
  }
  return buffer;
}
