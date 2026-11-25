import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import type { SessionClaims } from "@/lib/types";

export const SESSION_COOKIE = "ck_session";

interface SignedSession extends SessionClaims {
  exp: number;
}

function secret() {
  return process.env.SESSION_SECRET || "certkeep-mock-session-v1";
}

export function signSession(claims: SessionClaims) {
  const payload: SignedSession = {
    ...claims,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifySession(token: string | undefined | null): SessionClaims | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SignedSession;
    if (!payload.userId || payload.exp < Date.now()) return null;
    return {
      userId: payload.userId,
      orgId: payload.orgId,
      readOnly: Boolean(payload.readOnly),
    };
  } catch {
    return null;
  }
}

export function newId(prefix: string) {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function newToken() {
  return randomBytes(24).toString("hex");
}
