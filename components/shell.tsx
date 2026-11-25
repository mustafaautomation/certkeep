"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CreditCard,
  Files,
  HardHat,
  LayoutDashboard,
  Link2,
  Menu,
  ScrollText,
  Settings,
} from "lucide-react";
import { Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/app/vendors", label: "Vendors", icon: HardHat },
  { href: "/app/documents", label: "Documents", icon: Files },
  { href: "/app/reminders", label: "Reminders", icon: Bell },
  { href: "/app/requests", label: "Upload links", icon: Link2 },
  { href: "/app/audit", label: "Audit log", icon: ScrollText },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function Shell({
  orgName,
  plan,
  userName,
  children,
}: {
  orgName: string;
  plan: string;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden bg-[#173528] text-[#f6f1e6] md:flex md:flex-col">
        <div className="flex items-center gap-2 px-5 py-5 text-[#f6f1e6]">
          <Mark className="size-8" />
          <span className="font-display text-xl">Certkeep</span>
        </div>
        <Nav pathname={pathname} />
        <OrgFoot orgName={orgName} plan={plan} userName={userName} />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/app" className="flex items-center gap-2 text-primary">
            <Mark className="size-7" />
            <span className="font-display text-lg text-foreground">Certkeep</span>
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex size-9 items-center justify-center rounded-lg border bg-card"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-4" />
          </button>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </div>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#173528] text-[#f6f1e6] md:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <p className="font-display text-xl">Certkeep</p>
            <button type="button" className="rounded-lg border border-white/20 px-3 py-1 text-sm" onClick={() => setMenuOpen(false)}>
              Close
            </button>
          </div>
          <Nav pathname={pathname} onNavigate={() => setMenuOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}

function Nav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? "bg-white/15 text-white" : "text-[#d7e4dc] hover:bg-white/10"}`}
          >
            <Icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function OrgFoot({ orgName, plan, userName }: { orgName: string; plan: string; userName: string }) {
  const router = useRouter();
  return (
    <div className="mt-auto border-t border-white/10 p-4 text-sm">
      <p className="font-medium">{orgName}</p>
      <p className="text-[#d7e4dc]">{userName} · {plan}</p>
      <Button
        variant="outline"
        className="mt-3 w-full border-white/20 bg-transparent text-[#f6f1e6] hover:bg-white/10"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/");
          router.refresh();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
