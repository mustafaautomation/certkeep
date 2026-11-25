import type { NextRequest } from "next/server";
import { errorResponse, jsonWithSession } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      orgName?: string;
    };
    const result = getStore().signup({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      orgName: String(body.orgName ?? ""),
    });
    return jsonWithSession(
      { ok: true, redirectTo: "/app" },
      { userId: result.user.id, orgId: result.org.id, readOnly: false },
      request,
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
