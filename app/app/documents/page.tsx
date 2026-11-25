"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { PanelState, useApi } from "@/components/use-api";
import { formatDate } from "@/lib/dates";
import type { DocStatus, DocType } from "@/lib/types";

interface DocumentRow {
  id: string;
  vendorId: string;
  vendorName: string;
  type: DocType;
  typeLabel: string;
  issuer: string;
  number: string;
  expiryDate: string;
  status: DocStatus;
  hasFile: boolean;
}

const filters = ["all", "valid", "expiring", "expired"] as const;

export default function DocumentsPage() {
  const { data, error, loading, reload } = useApi<{ documents: DocumentRow[] }>("/api/documents");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const rows = useMemo(
    () => (data?.documents ?? []).filter((row) => filter === "all" || row.status === filter),
    [data, filter],
  );
  return (
    <PanelState loading={loading} error={error} onRetry={reload}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">Every certificate in this organization.</p>
        </div>
        <Link href="/app/documents/new" className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
          Add document
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-3 py-1 text-sm capitalize ring-1 ${filter === item ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <ul className="mt-4 grid gap-2">
        {rows.length === 0 ? (
          <li className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No documents in this view.</li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3">
              <div>
                <Link href={`/app/vendors/${row.vendorId}`} className="font-medium hover:underline">{row.vendorName}</Link>
                <p className="text-sm text-muted-foreground">{row.typeLabel} · {row.number} · {row.issuer} · {formatDate(row.expiryDate)}</p>
              </div>
              <StatusBadge status={row.status} />
            </li>
          ))
        )}
      </ul>
    </PanelState>
  );
}
