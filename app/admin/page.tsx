"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mark } from "@/components/mark";
import { PanelState, useApi } from "@/components/use-api";
import { Button } from "@/components/ui/button";

interface OrgRow {
  id: string;
  name: string;
  plan: string;
  vendors: number;
  documents: number;
  expiring: number;
  gaps: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { data, error, loading, reload } = useApi<{ organizations: OrgRow[] }>("/api/admin/overview");
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-2 text-primary">
          <Mark className="size-8" />
          <span className="font-display text-2xl text-foreground">Certkeep</span>
        </Link>
        <Button
          variant="outline"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/");
          }}
        >
          Sign out
        </Button>
      </div>
      <h1 className="mt-8 font-display text-4xl tracking-tight">Platform console</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Super-admin counts only. Vendor files and contact details are not shown here.
      </p>
      <div className="mt-6">
        <PanelState loading={loading} error={error} onRetry={reload}>
          <ul className="grid gap-3">
            {data?.organizations.map((org) => (
              <li key={org.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-medium">{org.name}</h2>
                  <span className="text-sm capitalize text-muted-foreground">{org.plan}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {org.vendors} vendors · {org.documents} documents · {org.expiring} expiring · {org.gaps} gaps
                </p>
              </li>
            ))}
          </ul>
        </PanelState>
      </div>
    </main>
  );
}
