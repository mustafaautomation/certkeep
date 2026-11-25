import type { Plan } from "@/lib/types";

export async function createCheckoutSession(input: {
  orgId: string;
  orgName: string;
  plan: Plan;
  origin: string;
  customerEmail: string;
}) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = input.plan === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_STARTER;
  if (!secret || !price) return null;

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: input.customerEmail,
    line_items: [{ price, quantity: 1 }],
    success_url: `${input.origin}/app/billing?status=success`,
    cancel_url: `${input.origin}/app/billing?status=cancel`,
    metadata: { orgId: input.orgId, plan: input.plan },
    subscription_data: { metadata: { orgId: input.orgId, plan: input.plan } },
  });
  return session.url;
}
