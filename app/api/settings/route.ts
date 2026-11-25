import type { NextRequest } from "next/server";
import { requireOrgActor, requireWriter } from "@/lib/actor";
import { errorResponse } from "@/lib/http";
import { integrationStatus } from "@/lib/mode";
import { getStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const actor = requireOrgActor(request);
    return Response.json({
      org: { id: actor.org.id, name: actor.org.name, slug: actor.org.slug, plan: actor.org.plan },
      user: actor.user,
      readOnly: actor.readOnly,
      integration: integrationStatus(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = requireWriter(request);
    const body = (await request.json()) as { name?: string };
    const org = getStore().updateOrg(actor.org.id, actor.user.id, String(body.name ?? ""));
    return Response.json({ org });
  } catch (error) {
    return errorResponse(error);
  }
}
