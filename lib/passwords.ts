import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export const DEMO_PASSWORD_HASHES = {
  harbor: hashPassword("harbor-demo"),
  lakeside: hashPassword("lakeside-demo"),
  super: hashPassword("super-demo"),
  demo: hashPassword(randomBytes(24).toString("hex")),
  dummy: hashPassword("not-a-real-account"),
};
