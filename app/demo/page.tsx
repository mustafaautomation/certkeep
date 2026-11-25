import Link from "next/link";
import { CoveragePills, DashboardView } from "@/components/dashboard-view";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  const board = getStore().demoBoard();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
          <p>Read-only demo of Harbor General Contractors. Files and contact details stay hidden. Writes are refused.</p>
          <form action="/api/auth/demo" method="post">
            <Button type="submit" variant="outline">Continue with a read-only session</Button>
          </form>
        </div>
        <DashboardView data={board} readOnly />
        <section>
          <h2 className="font-display text-2xl">Roster</h2>
          <div className="mt-4 grid gap-3">
            {board.vendors.map((vendor) => (
              <article key={vendor.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{vendor.name}</h3>
                    <p className="text-sm text-muted-foreground">{vendor.trade} · {vendor.city}</p>
                  </div>
                  <Link href={`/verify/${vendor.publicId}`} className="text-sm underline">
                    Public verification
                  </Link>
                </div>
                <div className="mt-3">
                  <CoveragePills coverage={vendor.coverage} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
