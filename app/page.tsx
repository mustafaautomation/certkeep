import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/mode";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const board = getStore().dashboard("org_harbor");
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Compliance vault</p>
            <h1 className="mt-3 max-w-xl font-display text-5xl leading-[1.05] tracking-tight md:text-6xl">
              Know which certificates are still good.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Certkeep is where a general contractor keeps subcontractor licenses, certificates of insurance, bonds, and CE credits. See what expires in 30 days, what is already a coverage gap, and prove status without emailing the PDF.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" render={<Link href="/demo" />}>Browse the Harbor demo</Button>
              <Button size="lg" variant="outline" render={<Link href="/signup" />}>Open a vault</Button>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-3 text-sm">
              <Metric label="Subcontractors" value={String(board.counts.vendors)} />
              <Metric label="Expiring" value={String(board.counts.expiring)} />
              <Metric label="Gaps" value={String(board.counts.gaps)} />
            </dl>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Harbor General Contractors</p>
              <span className="text-xs text-muted-foreground">Seeded roster</span>
            </div>
            <ul className="mt-4 grid gap-2">
              {board.upcoming.slice(0, 4).map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-l-4 border-l-amber-500 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{row.vendorName}</p>
                    <p className="text-xs text-muted-foreground">{row.typeLabel} · {row.issuer}</p>
                  </div>
                  <StatusBadge status="expiring" />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">Fictional companies. No real policies, and no contact details on the public page.</p>
          </div>
        </section>

        <section id="how" className="border-y bg-card/60">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
            <Step n="01" title="Register the roster" body="Each organization keeps its own subcontractors. A second company cannot open Harbor's vendors." />
            <Step n="02" title="Watch the dates" body="Valid, expiring within 30 days, and expired stay green, amber, and red. Reminders are queued at 30, 14, and 7 days." />
            <Step n="03" title="Prove it in public" body="A verification link shows status and issuer. Files, phone numbers, and email addresses stay in the vault." />
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl tracking-tight">Confirm the extraction before it is saved.</h2>
            <p className="mt-3 text-muted-foreground">
              Upload the fictional sample COI. Certkeep reads the holder, issuer, and expiry, then waits. A person confirms the fields. Without a Groq or Gemini key, a deterministic reader does the same job.
            </p>
          </div>
          <div className="rounded-2xl border bg-[#173528] p-6 text-[#f6f1e6]">
            <p className="text-xs uppercase tracking-[0.14em] text-[#d5c7a2]">Sample certificate</p>
            <p className="mt-3 font-display text-2xl">Pinnacle Mutual Insurance</p>
            <p className="mt-2 text-sm text-[#d7e4dc]">Holder: Harbor General Contractors</p>
            <p className="text-sm text-[#d7e4dc]">Expires 30 Jun 2027 · PM-COI-204418</p>
            <p className="mt-4 text-sm text-[#f3d48a]">Waiting for confirmation. Not saved yet.</p>
          </div>
        </section>

        <section id="pricing" className="mx-auto w-full max-w-6xl px-4 pb-16">
          <h2 className="font-display text-3xl tracking-tight">Starter and Pro, in test mode.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(["starter", "pro"] as const).map((plan) => (
              <article key={plan} className="rounded-2xl border bg-card p-6">
                <p className="text-sm uppercase tracking-wide text-muted-foreground">{PLANS[plan].name}</p>
                <p className="mt-2 font-display text-4xl">${PLANS[plan].price}<span className="text-base text-muted-foreground">/mo</span></p>
                <p className="mt-2 text-sm text-muted-foreground">{PLANS[plan].summary}</p>
                <ul className="mt-4 grid gap-2 text-sm">
                  {PLANS[plan].features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Without Stripe keys, plan changes stay inside the mock vault. No card is charged.</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-display text-2xl">{value}</dd>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <p className="font-display text-sm text-primary">{n}</p>
      <h2 className="mt-2 text-xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
