"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewVendorPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    const response = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "Could not register the vendor.");
      return;
    }
    router.push(`/app/vendors/${body.vendor.id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl tracking-tight">Register a vendor</h1>
      <p className="mt-2 text-sm text-muted-foreground">Use fictional contact details. This record stays inside your organization.</p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <Field name="name" label="Company" />
        <Field name="trade" label="Trade" />
        <Field name="contactName" label="Contact name" />
        <Field name="email" label="Email" type="email" />
        <Field name="phone" label="Phone" />
        <Field name="city" label="City" />
        {error ? <p className="text-sm text-red-800" role="alert">{error}</p> : null}
        <Button type="submit" disabled={busy}>Save vendor</Button>
      </form>
    </div>
  );
}

function Field({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required className="h-10" />
    </div>
  );
}
