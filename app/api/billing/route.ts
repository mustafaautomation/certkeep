import type { NextRequest } from "next/server";
import { requireOrgActor, requireWriter } from "@/lib/actor";
import { createCheckoutSession } from "@/lib/billing";
import { errorResponse } from "@/lib/http";
import { integrationStatus } from "@/lib/mode";
import { getStore } from "@/lib/store";
import type { Plan } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const actor = requireOrgActor(request);
    return Response.json({
      billing: getStore().billing(actor.org.id),
      integration: integrationStatus(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = requireWriter(request);
    const body = (await request.json()) as { plan?: string };
    const plan = body.plan === "pro" || body.plan === "starter" ? (body.plan as Plan) : null;
    if (!plan) return Response.json({ error: "Choose Starter or Pro." }, { status: 400 });
    const origin = request.nextUrl.origin;
    const url = await createCheckoutSession({
      orgId: actor.org.id,
      orgName: actor.org.name,
      plan,
      origin,
      customerEmail: actor.user.email,
    });
    if (url) return Response.json({ mode: "stripe", url });
    const billing = getStore().setPlan(actor.org.id, plan, actor.user.id, "mock");
    return Response.json({ mode: "mock", billing });
  } catch (error) {
    return errorResponse(error);
  }
}
