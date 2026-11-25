import type { NextRequest } from "next/server";
import { requireWriter } from "@/lib/actor";
import { decodeBase64File, errorResponse } from "@/lib/http";
import { extractCertificate } from "@/lib/extract";

export async function POST(request: NextRequest) {
  try {
    requireWriter(request);
    const body = (await request.json()) as { fileName?: string; dataBase64?: string };
    const bytes = decodeBase64File(body.dataBase64);
    if (!bytes) return Response.json({ error: "Choose a PDF to read." }, { status: 400 });
    const extracted = await extractCertificate({
      bytes,
      fileName: String(body.fileName ?? "certificate.pdf"),
    });
    return Response.json({ extracted });
  } catch (error) {
    return errorResponse(error);
  }
}
