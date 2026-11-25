import Link from "next/link";
import { formatDate } from "@/lib/dates";
import { DOC_LABEL, type CoverageSlot, type DocStatus, type DocType } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ExpiryRow {
  id: string;
  vendorId: string;
  vendorName: string;
  type: DocType;
  typeLabel: string;
  issuer: string;
  number?: string;
  expiryDate: string;
  daysLeft: number;
  status: DocStatus;
}

export interface GapRow {
  vendorId: string;
  vendorName: string;
  trade: string;
  reasons: string[];
}

export interface DashboardData {
  orgName: string;
  plan: string;
  counts: { vendors: number; valid: number; expiring: number; expired: number; gaps: number };
  upcoming: ExpiryRow[];
  expired: ExpiryRow[];
  gaps: GapRow[];
}

export function DashboardView({
  data,
  readOnly = false,
}: {
  data: DashboardData;
  readOnly?: boolean;
}) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{data.orgName}</p>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">Compliance overview</h1>
        </div>
        {readOnly ? (
          <p className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-950 ring-1 ring-amber-200">
            Read-only demo
          </p>
        ) : (
          <Link href="/app/documents/new" className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
            Add document
          </Link>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Vendors" value={data.counts.vendors} />
        <Stat label="Valid" value={data.counts.valid} tone="valid" />
        <Stat label="Expiring" value={data.counts.expiring} tone="expiring" />
        <Stat label="Expired" value={data.counts.expired} tone="expired" />
        <Stat label="Coverage gaps" value={data.counts.gaps} tone="expired" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming expiries</CardTitle>
            <p className="text-sm text-muted-foreground">Inside the next 30 days. Amber means still in force, but close.</p>
          </CardHeader>
          <CardContent>
            <ExpiryList rows={data.upcoming} testId="expiring-list" empty="Nothing expires in the next 30 days." readOnly={readOnly} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Coverage gaps</CardTitle>
            <p className="text-sm text-muted-foreground">A license or certificate of insurance is missing or expired. Expired bonds and CE credits are listed too.</p>
          </CardHeader>
          <CardContent>
            <div data-testid="gap-list" className="grid gap-2">
              {data.gaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">Every required document is current.</p>
              ) : (
                data.gaps.map((gap) => (
                  <div key={gap.vendorId} className="rounded-lg border border-red-200 bg-red-50/70 p-3">
                    {readOnly ? (
                      <p className="font-medium">{gap.vendorName}</p>
                    ) : (
                      <Link href={`/app/vendors/${gap.vendorId}`} className="font-medium hover:underline">
                        {gap.vendorName}
                      </Link>
                    )}
                    <p className="text-xs text-muted-foreground">{gap.trade}</p>
                    <ul className="mt-2 grid gap-1 text-sm text-red-950">
                      {gap.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Already expired</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpiryList rows={data.expired} testId="expired-list" empty="No expired documents on file." readOnly={readOnly} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "valid" | "expiring" | "expired" }) {
  const toneClass =
    tone === "valid"
      ? "border-emerald-200"
      : tone === "expiring"
        ? "border-amber-200"
        : tone === "expired"
          ? "border-red-200"
          : "border-border";
  return (
    <div className={`rounded-xl border bg-card p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-3xl">{value}</p>
    </div>
  );
}

function ExpiryList({
  rows,
  testId,
  empty,
  readOnly,
}: {
  rows: ExpiryRow[];
  testId: string;
  empty: string;
  readOnly: boolean;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul data-testid={testId} className="grid gap-2">
      {rows.map((row) => (
        <li
          key={row.id}
          className={`rounded-lg border-l-4 bg-card px-3 py-2 ${row.status === "expired" ? "border-l-red-600" : "border-l-amber-500"}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              {readOnly ? (
                <p className="font-medium">{row.vendorName}</p>
              ) : (
                <Link href={`/app/vendors/${row.vendorId}`} className="font-medium hover:underline">
                  {row.vendorName}
                </Link>
              )}
              <p className="text-sm text-muted-foreground">
                {row.typeLabel || DOC_LABEL[row.type]} · {row.issuer} · {formatDate(row.expiryDate)}
              </p>
            </div>
            <StatusBadge status={row.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CoveragePills({ coverage }: { coverage: Record<DocType, CoverageSlot> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(DOC_LABEL) as DocType[]).map((type) => (
        <span key={type} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          {DOC_LABEL[type]}
          <StatusBadge status={coverage[type]} />
        </span>
      ))}
    </div>
  );
}
