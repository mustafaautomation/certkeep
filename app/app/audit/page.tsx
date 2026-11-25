"use client";

import { PanelState, useApi } from "@/components/use-api";

interface AuditEvent {
  id: string;
  action: string;
  summary: string;
  at: string;
}

export default function AuditPage() {
  const { data, error, loading, reload } = useApi<{ events: AuditEvent[] }>("/api/audit");
  return (
    <PanelState loading={loading} error={error} onRetry={reload}>
      <h1 className="font-display text-3xl tracking-tight">Audit log</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Append-only. Certkeep records who changed the vault and does not offer edit or delete. A delete request is rejected.
      </p>
      <ol className="mt-6 grid gap-3 border-l border-border pl-4">
        {data?.events.map((event) => (
          <li key={event.id}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{event.action} · {new Date(event.at).toLocaleString()}</p>
            <p className="text-sm">{event.summary}</p>
          </li>
        ))}
      </ol>
    </PanelState>
  );
}
