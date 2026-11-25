import type { NextRequest } from "next/server";
import { requireOrgActor, requireWriter } from "@/lib/actor";
import { errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const actor = requireOrgActor(request);
    return Response.json({ vendors: getStore().listVendors(actor.org.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = requireWriter(request);
    const body = (await request.json()) as {
      name?: string;
      trade?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      city?: string;
    };
    const vendor = getStore().createVendor(actor.org.id, actor.user.id, {
      name: String(body.name ?? ""),
      trade: String(body.trade ?? ""),
      contactName: String(body.contactName ?? ""),
      email: String(body.email ?? ""),
      phone: String(body.phone ?? ""),
      city: String(body.city ?? ""),
    });
    return Response.json({ vendor }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
