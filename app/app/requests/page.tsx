"use client";

import { PanelState, useApi } from "@/components/use-api";

interface UploadLink {
  id: string;
  vendorName: string;
  path: string;
  status: string;
  expiresAt: string;
}

export default function RequestsPage() {
  const { data, error, loading, reload } = useApi<{ requests: UploadLink[] }>("/api/requests");
  return (
    <PanelState loading={loading} error={error} onRetry={reload}>
      <h1 className="font-display text-3xl tracking-tight">Upload links</h1>
      <p className="mt-2 text-sm text-muted-foreground">Create a link from a vendor record. The subcontractor can submit one document without an account.</p>
      <ul className="mt-6 grid gap-2">
        {data?.requests.length === 0 ? (
          <li className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No upload links yet.</li>
        ) : (
          data?.requests.map((item) => (
            <li key={item.id} className="rounded-xl border bg-card px-4 py-3 text-sm">
              <p className="font-medium">{item.vendorName}</p>
              <p className="break-all text-muted-foreground">{item.path}</p>
              <p className="capitalize text-muted-foreground">{item.status} · expires {item.expiresAt}</p>
            </li>
          ))
        )}
      </ul>
    </PanelState>
  );
}
