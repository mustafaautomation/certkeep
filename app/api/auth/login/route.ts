import type { NextRequest } from "next/server";
import { errorResponse, jsonWithSession } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const result = getStore().login(String(body.email ?? ""), String(body.password ?? ""));
    if (!result) {
      return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    const redirectTo = result.user.platformRole === "superadmin" ? "/admin" : "/app";
    return jsonWithSession(
      { ok: true, redirectTo, name: result.user.name },
      { userId: result.user.id, orgId: result.org?.id ?? null, readOnly: false },
      request,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
