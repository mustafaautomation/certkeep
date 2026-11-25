"use client";

import { useState } from "react";
import { PanelState, useApi } from "@/components/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsPayload {
  org: { name: string; slug: string; plan: string };
  user: { name: string; email: string };
  integration: { data: string; llm: string; email: string; stripeConfigured: boolean; supabaseConfigured: boolean };
}

export default function SettingsPage() {
  const { data, error, loading, reload, setData } = useApi<SettingsPayload>("/api/settings");
  const [draft, setDraft] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const name = draft ?? data?.org.name ?? "";

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = await response.json();
    if (!response.ok || !data) {
      setNote(body.error || "Could not rename the organization.");
      return;
    }
    setData({ ...data, org: { ...data.org, name: body.org.name } });
    setNote("Organization name saved.");
  }

  return (
    <PanelState loading={loading} error={error} onRetry={reload}>
      {data ? (
        <div className="grid max-w-xl gap-6">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Settings</h1>
            <p className="mt-2 text-sm text-muted-foreground">{data.user.name} · {data.user.email}</p>
          </div>
          <form onSubmit={save} className="grid gap-3">
            <Label htmlFor="orgName">Organization name</Label>
            <Input id="orgName" value={name} onChange={(event) => setDraft(event.target.value)} className="h-10" />
            <Button type="submit">Save name</Button>
          </form>
          {note ? <p className="text-sm">{note}</p> : null}
          <dl className="grid gap-2 rounded-xl border bg-card p-4 text-sm">
            <Row label="Data" value={data.integration.data === "mock" ? "Mock vault" : "Supabase"} />
            <Row label="Extraction" value={data.integration.llm} />
            <Row label="Email" value={data.integration.email} />
            <Row label="Stripe" value={data.integration.stripeConfigured ? "Test keys present" : "Mock checkout"} />
            <Row label="Supabase env" value={data.integration.supabaseConfigured ? "Present" : "Not set"} />
            <Row label="Slug" value={data.org.slug} />
            <Row label="Plan" value={data.org.plan} />
          </dl>
        </div>
      ) : null}
    </PanelState>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="capitalize">{value}</dd>
    </div>
  );
}
