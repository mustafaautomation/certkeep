import { DocumentForm } from "@/components/document-form";

export default function NewDocumentPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl tracking-tight">Add a document</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Extract fields from a PDF, review them, then confirm. Manual entry saves without extraction.
      </p>
      <div className="mt-6">
        <DocumentForm />
      </div>
    </div>
  );
}
