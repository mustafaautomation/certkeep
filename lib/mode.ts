export type DataMode = "mock";

export function integrationStatus() {
  const groq = Boolean(process.env.GROQ_API_KEY);
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  return {
    data: "mock" as DataMode,
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO),
    llm: groq ? "groq" : gemini ? "gemini" : "mock",
    email: "mock" as const,
  };
}

export const PLANS = {
  starter: {
    name: "Starter",
    price: 49,
    vendorLimit: 25,
    summary: "For a GC tracking one active project roster.",
    features: ["25 subcontractors", "License, COI, bond, and CE tracking", "Mocked 30/14/7 reminders", "Public verification page"],
  },
  pro: {
    name: "Pro",
    price: 149,
    vendorLimit: null,
    summary: "For agencies watching several jobs at once.",
    features: ["Unlimited subcontractors", "Everything in Starter", "Append-only audit export", "Priority reminder sweep"],
  },
} as const;
