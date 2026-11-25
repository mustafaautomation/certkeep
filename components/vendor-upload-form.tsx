"use client";

import { useState } from "react";
import { DOC_LABEL, DOC_TYPES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function VendorUploadForm({
  token,
  orgName,
  vendorName,
  trade,
  fulfilled,
  expired,
}: {
  token: string;
  orgName: string;
  vendorName: string;
  trade: string;
  fulfilled: boolean;
  expired: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (fulfilled) return <p className="rounded-xl border bg-card p-4">This link has already been used.</p>;
  if (expired) return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-950">This link has expired. Ask {orgName} for a new one.</p>;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    setBusy(true);
    setError(null);
    let dataBase64: string | undefined;
    if (file instanceof File && file.size > 0) {
      dataBase64 = await readFile(file);
    }
    const response = await fetch(`/api/requests/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.get("type"),
        holder: orgName,
        issuer: form.get("issuer"),
        number: form.get("number"),
        issueDate: form.get("issueDate"),
        expiryDate: form.get("expiryDate"),
        fileName: file instanceof File ? file.name : undefined,
        mime: file instanceof File ? file.type : undefined,
        dataBase64,
      }),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "Could not submit the document.");
      return;
    }
    setMessage("Document received. You can close this page.");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border bg-card p-6">
      <p className="text-sm text-muted-foreground">{vendorName} · {trade} · sending to {orgName}</p>
      <div className="grid gap-1.5">
        <Label htmlFor="type">Document type</Label>
        <select id="type" name="type" className={fieldClass} defaultValue="coi">
          {DOC_TYPES.map((type) => (
            <option key={type} value={type}>{DOC_LABEL[type]}</option>
          ))}
        </select>
      </div>
      <Field id="issuer" name="issuer" label="Issuer" />
      <Field id="number" name="number" label="Number" />
      <Field id="issueDate" name="issueDate" label="Issue date" type="date" />
      <Field id="expiryDate" name="expiryDate" label="Expiry date" type="date" />
      <div className="grid gap-1.5">
        <Label htmlFor="file">File</Label>
        <Input id="file" name="file" type="file" accept="application/pdf,.pdf" className="h-10" />
      </div>
      {error ? <p className="text-sm text-red-800" role="alert">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-900" role="status">{message}</p> : <Button type="submit" disabled={busy}>Submit document</Button>}
    </form>
  );
}

function Field({ id, name, label, type = "text" }: { id: string; name: string; label: string; type?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} required className="h-10" />
    </div>
  );
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}
