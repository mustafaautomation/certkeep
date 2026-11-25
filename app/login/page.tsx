"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState<string>(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState<string>(DEMO_ACCOUNTS[0].password);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(nextEmail = email, nextPassword = password) {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: nextEmail, password: nextPassword }),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "Could not sign in.");
      return;
    }
    router.push(body.redirectTo);
    router.refresh();
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-2">
      <div>
        <Link href="/" className="inline-flex items-center gap-2 text-primary">
          <Mark className="size-8" />
          <span className="font-display text-2xl text-foreground">Certkeep</span>
        </Link>
        <h1 className="mt-6 font-display text-4xl tracking-tight">Sign in to the vault</h1>
        <p className="mt-3 text-muted-foreground">
          Demo accounts use fictional names and .example addresses. The read-only Harbor tour does not require a password.
        </p>
        <Button className="mt-6" variant="outline" render={<Link href="/demo" />}>Enter read-only demo</Button>
      </div>
      <form
        className="grid gap-4 rounded-2xl border bg-card p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-10" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-10" />
        </div>
        {error ? <p className="text-sm text-red-800" role="alert">{error}</p> : null}
        <Button type="submit" disabled={busy} className="h-10">Sign in</Button>
        <div className="grid gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.id}
              type="button"
              className="rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
                void submit(account.email, account.password);
              }}
            >
              <span className="font-medium">{account.label}</span>
              <span className="mt-0.5 block text-muted-foreground">{account.detail}</span>
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          New organization? <Link href="/signup" className="underline">Create a vault</Link>
        </p>
      </form>
    </main>
  );
}
