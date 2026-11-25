import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { VendorUploadForm } from "@/components/vendor-upload-form";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function RequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const info = getStore().publicRequest(token);
  if (!info) notFound();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-xl gap-4 px-4 py-12">
        <p className="text-sm text-muted-foreground">Vendor upload</p>
        <h1 className="font-display text-4xl tracking-tight">Send a certificate</h1>
        <p className="text-muted-foreground">No account is required. {info.orgName} will review what you submit.</p>
        <VendorUploadForm token={token} {...info} />
      </main>
    </>
  );
}
