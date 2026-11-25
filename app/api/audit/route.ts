import type { NextRequest } from "next/server";
import { requireOrgActor } from "@/lib/actor";
import { errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const actor = requireOrgActor(request);
    return Response.json({ events: getStore().listAudit(actor.org.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH() {
  return Response.json({ error: "Audit entries are append-only." }, { status: 405 });
}

export async function DELETE() {
  return Response.json({ error: "Audit entries are append-only." }, { status: 405 });
}
