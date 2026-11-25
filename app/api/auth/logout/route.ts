import type { NextRequest } from "next/server";
import { clearSession } from "@/lib/http";

export async function POST(request: NextRequest) {
  return clearSession({ ok: true }, request);
}
