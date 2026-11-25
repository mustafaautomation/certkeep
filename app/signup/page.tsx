"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        orgName: form.get("orgName"),
      }),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "Could not create the vault.");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <main className="mx-auto grid w-full max-w-lg gap-6 px-4 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-primary">
        <Mark className="size-8" />
        <span className="font-display text-2xl text-foreground">Certkeep</span>
      </Link>
      <h1 className="font-display text-4xl tracking-tight">Open a vault</h1>
      <p className="text-muted-foreground">This organization starts empty on the Starter plan. Use a fictional email. Nothing here is a real customer record.</p>
      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border bg-card p-6">
        <Field id="orgName" name="orgName" label="Organization" required />
        <Field id="name" name="name" label="Your name" required />
        <Field id="email" name="email" label="Email" type="email" required />
        <Field id="password" name="password" label="Password" type="password" required />
        {error ? <p className="text-sm text-red-800" role="alert">{error}</p> : null}
        <Button type="submit" disabled={busy} className="h-10">Create vault</Button>
        <p className="text-sm text-muted-foreground">Already registered? <Link className="underline" href="/login">Sign in</Link></p>
      </form>
    </main>
  );
}

function Field({ id, name, label, type = "text", required }: { id: string; name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} required={required} className="h-10" />
    </div>
  );
}
