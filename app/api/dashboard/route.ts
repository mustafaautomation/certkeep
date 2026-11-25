import type { NextRequest } from "next/server";
import { requireOrgActor } from "@/lib/actor";
import { errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const actor = requireOrgActor(request);
    return Response.json(getStore().dashboard(actor.org.id));
  } catch (error) {
    return errorResponse(error);
  }
}
