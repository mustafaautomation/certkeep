import Link from "next/link";
import { Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <Mark className="size-8" />
          <span className="font-display text-xl tracking-tight text-foreground">Certkeep</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <Link href="/verify/northline-electrical" className="hover:text-foreground">Sample verification</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />}>Sign in</Button>
          <Button render={<Link href="/demo" />}>Open demo</Button>
        </div>
      </div>
    </header>
  );
}
