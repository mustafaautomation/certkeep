import type { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import type { Plan } from "@/lib/types";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    return Response.json({ error: "Stripe is not configured." }, { status: 501 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature." }, { status: 400 });
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(key);
  const payload = await request.text();
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orgId = session.metadata?.orgId;
      const plan = session.metadata?.plan;
      if (orgId && (plan === "starter" || plan === "pro")) {
        getStore().setPlan(orgId, plan as Plan, null, "stripe");
      }
    }
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }
}
