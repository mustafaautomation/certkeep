"use client";

import { useState } from "react";
import { PanelState, useApi } from "@/components/use-api";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";

interface ReminderRow {
  id: string;
  vendorName: string;
  typeLabel: string;
  daysBefore: number;
  scheduledFor: string;
  state: "scheduled" | "due" | "sent";
  number: string;
}

interface Mail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

export default function RemindersPage() {
  const { data, error, loading, reload, setData } = useApi<{ rows: ReminderRow[]; outbox: Mail[] }>("/api/reminders");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sweep() {
    setBusy(true);
    setNote(null);
    const response = await fetch("/api/reminders", { method: "POST" });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setNote(body.error || "Could not run the sweep.");
      return;
    }
    setData({ rows: body.rows, outbox: body.outbox });
    setNote(`Mocked email queued for ${body.sent} reminder${body.sent === 1 ? "" : "s"}. Nothing left the building.`);
  }

  return (
    <PanelState loading={loading} error={error} onRetry={reload}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Reminders</h1>
          <p className="text-sm text-muted-foreground">Each document is scheduled at 30, 14, and 7 days before expiry. Delivery is mocked.</p>
        </div>
        <Button type="button" onClick={sweep} disabled={busy}>Send due reminders</Button>
      </div>
      {note ? <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">{note}</p> : null}
      <ul className="mt-4 grid gap-2">
        {data?.rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{row.vendorName} · {row.typeLabel}</p>
              <p className="text-muted-foreground">{row.daysBefore} days · {formatDate(row.scheduledFor)} · {row.number}</p>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{row.state}</span>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 font-display text-2xl">Mocked email</h2>
      <div className="mt-3 grid gap-3">
        {data?.outbox.length === 0 ? <p className="text-sm text-muted-foreground">No reminders have been queued yet.</p> : null}
        {data?.outbox.map((mail) => (
          <article key={mail.id} className="rounded-xl border bg-card p-4 text-sm">
            <p className="font-medium">{mail.subject}</p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-muted-foreground">{mail.body}</pre>
          </article>
        ))}
      </div>
    </PanelState>
  );
}
