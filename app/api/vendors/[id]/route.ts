import type { NextRequest } from "next/server";
import { requireOrgActor } from "@/lib/actor";
import { errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = requireOrgActor(request);
    const { id } = await context.params;
    const vendor = getStore().getVendor(actor.org.id, id);
    if (!vendor) return Response.json({ error: "Vendor not found." }, { status: 404 });
    return Response.json({ vendor });
  } catch (error) {
    return errorResponse(error);
  }
}
