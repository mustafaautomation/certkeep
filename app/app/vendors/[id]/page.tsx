"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CoveragePills } from "@/components/dashboard-view";
import { StatusBadge } from "@/components/status-badge";
import { PanelState, useApi } from "@/components/use-api";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import type { CoverageSlot, DocStatus, DocType } from "@/lib/types";

interface VendorDetail {
  id: string;
  name: string;
  trade: string;
  city: string;
  contactName: string;
  email: string;
  phone: string;
  publicId: string;
  coverage: Record<DocType, CoverageSlot>;
  gaps: string[];
  documents: Array<{
    id: string;
    typeLabel: string;
    issuer: string;
    number: string;
    expiryDate: string;
    status: DocStatus;
    hasFile: boolean;
  }>;
}

export default function VendorDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, error, loading, reload } = useApi<{ vendor: VendorDetail }>(`/api/vendors/${params.id}`);
  const [link, setLink] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const vendor = data?.vendor;

  async function createLink() {
    setLinkError(null);
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: params.id }),
    });
    const body = await response.json();
    if (!response.ok) {
      setLinkError(body.error || "Could not create the link.");
      return;
    }
    setLink(`${window.location.origin}${body.request.path}`);
  }

  return (
    <PanelState loading={loading} error={error} onRetry={reload}>
      {vendor ? (
        <div className="grid gap-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{vendor.trade} · {vendor.city}</p>
              <h1 className="font-display text-3xl tracking-tight">{vendor.name}</h1>
              <p className="mt-2 text-sm">Contact {vendor.contactName} · {vendor.email} · {vendor.phone}</p>
            </div>
            <Link href="/app/documents/new" className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
              Add document
            </Link>
          </div>
          <CoveragePills coverage={vendor.coverage} />
          {vendor.gaps.length > 0 ? (
            <ul className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950">
              {vendor.gaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
          ) : null}
          <section className="rounded-xl border bg-card p-4">
            <h2 className="font-medium">Public verification</h2>
            <p className="mt-1 text-sm text-muted-foreground">Share this read-only page. It hides files and contact data.</p>
            <p className="mt-2 break-all text-sm">/verify/{vendor.publicId}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={createLink}>Create vendor upload link</Button>
              <Link href={`/verify/${vendor.publicId}`} className="inline-flex h-8 items-center text-sm underline">Open verification</Link>
            </div>
            {link ? <p className="mt-3 break-all rounded-lg bg-muted px-3 py-2 text-sm">{link}</p> : null}
            {linkError ? <p className="mt-2 text-sm text-red-800">{linkError}</p> : null}
          </section>
          <section>
            <h2 className="font-medium">Documents</h2>
            <ul className="mt-3 grid gap-2">
              {vendor.documents.map((document) => (
                <li key={document.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
                  <div>
                    <p className="font-medium">{document.typeLabel} · {document.number}</p>
                    <p className="text-sm text-muted-foreground">{document.issuer} · {formatDate(document.expiryDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={document.status} />
                    {document.hasFile ? (
                      <a className="text-sm underline" href={`/api/documents/${document.id}/file`}>Download</a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </PanelState>
  );
}
