import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { SiteHeader } from "@/components/site-header";
import { formatDate } from "@/lib/dates";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const profile = getStore().publicProfile(publicId);
  if (!profile) notFound();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <p className="text-sm text-muted-foreground">Public verification · {profile.orgName}</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{profile.vendorName}</h1>
        <p className="mt-2 text-muted-foreground">{profile.trade} · {profile.city}</p>
        <p className="mt-4 rounded-xl border bg-card px-4 py-3 text-sm">
          This page shows whether each document is valid, expiring, or expired. It does not include files, policy numbers, phone numbers, or email addresses.
        </p>
        <ul className="mt-6 grid gap-3">
          {profile.documents.length === 0 ? (
            <li className="text-sm text-muted-foreground">No documents are on the public record.</li>
          ) : (
            profile.documents.map((document) => (
              <li key={`${document.type}-${document.expiryDate}-${document.issuer}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
                <div>
                  <p className="font-medium">{document.typeLabel}</p>
                  <p className="text-sm text-muted-foreground">{document.issuer} · expires {formatDate(document.expiryDate)}</p>
                </div>
                <StatusBadge status={document.status} testId={`status-${document.type}`} />
              </li>
            ))
          )}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">Checked {formatDate(profile.checkedAt.slice(0, 10))}. This page cannot change records.</p>
        <Link href="/demo" className="mt-4 inline-block text-sm underline">Back to the demo</Link>
      </main>
    </>
  );
}
