import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>Certkeep tracks dates and files you upload. It does not give legal, insurance, or coverage advice.</p>
        <div className="flex gap-4">
          <Link href="/demo" className="hover:text-foreground">Read-only demo</Link>
          <Link href="/signup" className="hover:text-foreground">Open a vault</Link>
        </div>
      </div>
    </footer>
  );
}
