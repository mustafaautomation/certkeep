import type { NextRequest } from "next/server";
import { requireOrgActor, requireWriter } from "@/lib/actor";
import { errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const actor = requireOrgActor(request);
    return Response.json({ requests: getStore().listRequests(actor.org.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = requireWriter(request);
    const body = (await request.json()) as { vendorId?: string };
    const upload = getStore().createRequest(actor.org.id, actor.user.id, String(body.vendorId ?? ""));
    return Response.json({ request: upload }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
