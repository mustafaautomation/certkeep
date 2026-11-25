"use client";

import Link from "next/link";
import { CoveragePills } from "@/components/dashboard-view";
import { PanelState, useApi } from "@/components/use-api";
import type { CoverageSlot, DocType } from "@/lib/types";

interface VendorRow {
  id: string;
  name: string;
  trade: string;
  city: string;
  email: string;
  coverage: Record<DocType, CoverageSlot>;
  gaps: string[];
}

export default function VendorsPage() {
  const { data, error, loading, reload } = useApi<{ vendors: VendorRow[] }>("/api/vendors");
  return (
    <PanelState loading={loading} error={error} onRetry={reload}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground">Subcontractors registered to this organization only.</p>
        </div>
        <Link href="/app/vendors/new" className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
          Add vendor
        </Link>
      </div>
      <div className="mt-6 grid gap-3">
        {data?.vendors.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No subcontractors yet. Register the first vendor to start a compliance file.</p>
        ) : (
          data?.vendors.map((vendor) => (
            <Link key={vendor.id} href={`/app/vendors/${vendor.id}`} className="rounded-xl border bg-card p-4 hover:border-primary/40">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-medium">{vendor.name}</h2>
                  <p className="text-sm text-muted-foreground">{vendor.trade} · {vendor.city}</p>
                </div>
                {vendor.gaps.length > 0 ? (
                  <span className="text-xs font-medium text-red-800">{vendor.gaps.length} gap{vendor.gaps.length === 1 ? "" : "s"}</span>
                ) : (
                  <span className="text-xs font-medium text-emerald-800">Required coverage on file</span>
                )}
              </div>
              <div className="mt-3">
                <CoveragePills coverage={vendor.coverage} />
              </div>
            </Link>
          ))
        )}
      </div>
    </PanelState>
  );
}
