"use client";

import { useEffect, useState } from "react";
import { DOC_LABEL, DOC_TYPES, type DocType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VendorOption {
  id: string;
  name: string;
}

interface Extracted {
  holder: string;
  insured: string;
  issuer: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  source: string;
  note: string;
}

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function DocumentForm() {
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [type, setType] = useState<DocType>("coi");
  const [holder, setHolder] = useState("");
  const [issuer, setIssuer] = useState("");
  const [number, setNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/vendors").then((response) => response.json()), fetch("/api/auth/me").then((response) => response.json())]).then(
      ([vendorBody, me]) => {
        const list = (vendorBody.vendors ?? []) as VendorOption[];
        setVendors(list);
        if (list[0]) setVendorId(list[0].id);
        if (me?.org?.name) setHolder((current) => current || me.org.name);
      },
    );
  }, []);

  async function extract() {
    if (!file) {
      setError("Choose a PDF before extracting fields.");
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const dataBase64 = await readFile(file);
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, dataBase64 }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Extraction failed.");
      const next = body.extracted as Extracted;
      setExtracted(next);
      if (next.holder) setHolder(next.holder);
      if (next.issuer) setIssuer(next.issuer);
      if (next.number) setNumber(next.number);
      if (next.issueDate) setIssueDate(next.issueDate);
      if (next.expiryDate) setExpiryDate(next.expiryDate);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Extraction failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const source = submitter?.value === "confirm" ? "extract" : "manual";
    setBusy(true);
    setError(null);
    try {
      const dataBase64 = file ? await readFile(file) : undefined;
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          type,
          holder,
          issuer,
          number,
          issueDate,
          expiryDate,
          source,
          fileName: file?.name,
          mime: file?.type || "application/pdf",
          dataBase64,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not save the document.");
      setSaved(body.document.number as string);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the document.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="vendorId">Vendor</Label>
          <select id="vendorId" className={fieldClass} value={vendorId} onChange={(event) => setVendorId(event.target.value)} required>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="docType">Document type</Label>
          <select id="docType" className={fieldClass} value={type} onChange={(event) => setType(event.target.value as DocType)}>
            {DOC_TYPES.map((item) => (
              <option key={item} value={item}>
                {DOC_LABEL[item]}
              </option>
            ))}
          </select>
        </div>
        <Field id="holder" label="Holder" value={holder} onChange={setHolder} />
        <Field id="issuer" label="Issuer" value={issuer} onChange={setIssuer} required />
        <Field id="number" label="Number" value={number} onChange={setNumber} required />
        <div className="grid gap-1.5">
          <Label htmlFor="issueDate">Issue date</Label>
          <Input id="issueDate" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required className="h-10" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="expiryDate">Expiry date</Label>
          <Input id="expiryDate" type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} required className="h-10" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="certificateFile">Certificate file</Label>
          <Input
            id="certificateFile"
            type="file"
            accept="application/pdf,.pdf"
            className="h-10"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Try the fictional sample at <a className="underline" href="/samples/sample-coi.pdf">sample-coi.pdf</a>. Extraction fills the fields. Nothing is stored until you confirm.
      </p>
      {extracted ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">Review before saving · {extracted.source}</p>
          <p className="mt-1">{extracted.note}</p>
          {extracted.insured ? <p className="mt-1">Insured named on the file: {extracted.insured}</p> : null}
        </div>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">{error}</p>
      ) : null}
      {saved ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950" role="status">
          Document saved · {saved}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={extract} disabled={busy}>
          Extract fields
        </Button>
        {extracted ? (
          <Button type="submit" value="confirm" disabled={busy}>
            Confirm and save
          </Button>
        ) : null}
        <Button type="submit" value="manual" variant="secondary" disabled={busy}>
          Save document
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="h-10" />
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
