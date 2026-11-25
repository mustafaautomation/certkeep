"use client";

import { useState } from "react";
import { PanelState, useApi } from "@/components/use-api";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/mode";
import type { Plan } from "@/lib/types";

interface BillingPayload {
  billing: { plan: Plan; vendorCount: number; vendorLimit: number | null };
  integration: { stripeConfigured: boolean };
}

export default function BillingPage() {
  const { data, error, loading, reload, setData } = useApi<BillingPayload>("/api/billing");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function changePlan(plan: Plan) {
    setBusy(true);
    setNote(null);
    const response = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setNote(body.error || "Could not change the plan.");
      return;
    }
    if (body.mode === "stripe" && body.url) {
      window.location.assign(body.url);
      return;
    }
    setData({
      billing: body.billing,
      integration: data?.integration ?? { stripeConfigured: false },
    });
    setNote(`Switched to ${plan} in test mode. No card was charged.`);
  }

  const plan = data?.billing.plan;
  return (
    <PanelState loading={loading} error={error} onRetry={reload}>
      <h1 className="font-display text-3xl tracking-tight">Billing</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Current plan <span data-testid="current-plan" className="font-medium text-foreground">{plan}</span>
        {" "}· {data?.billing.vendorCount} vendors
        {data?.billing.vendorLimit ? ` of ${data.billing.vendorLimit}` : ""}.
        {data?.integration.stripeConfigured ? " Stripe test checkout is connected." : " Stripe keys are absent, so checkout stays mocked."}
      </p>
      {note ? <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{note}</p> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(["starter", "pro"] as const).map((item) => (
          <article key={item} className={`rounded-2xl border bg-card p-5 ${plan === item ? "ring-2 ring-primary" : ""}`}>
            <h2 className="font-display text-2xl">{PLANS[item].name}</h2>
            <p className="mt-1 font-display text-3xl">${PLANS[item].price}<span className="text-sm text-muted-foreground">/mo</span></p>
            <ul className="mt-3 grid gap-1 text-sm">
              {PLANS[item].features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <Button className="mt-4" disabled={busy || plan === item} onClick={() => changePlan(item)}>
              {item === "pro" ? "Switch to Pro" : "Switch to Starter"}
            </Button>
          </article>
        ))}
      </div>
    </PanelState>
  );
}
