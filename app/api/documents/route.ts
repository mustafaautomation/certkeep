import type { NextRequest } from "next/server";
import { requireOrgActor, requireWriter } from "@/lib/actor";
import { decodeBase64File, errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";
import { DOC_TYPES, type DocType, type DocumentRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const actor = requireOrgActor(request);
    return Response.json({ documents: getStore().listDocuments(actor.org.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = requireWriter(request);
    const body = (await request.json()) as {
      vendorId?: string;
      type?: string;
      holder?: string;
      issuer?: string;
      number?: string;
      issueDate?: string;
      expiryDate?: string;
      source?: string;
      fileName?: string;
      mime?: string;
      dataBase64?: string;
    };
    const type = body.type as DocType;
    if (!DOC_TYPES.includes(type)) {
      return Response.json({ error: "Choose a document type." }, { status: 400 });
    }
    const source = (body.source === "extract" ? "extract" : "manual") as DocumentRecord["source"];
    const file = body.dataBase64 ? decodeBase64File(body.dataBase64) : null;
    const document = getStore().createDocument(actor.org.id, actor.user.id, {
      vendorId: String(body.vendorId ?? ""),
      type,
      holder: String(body.holder ?? ""),
      issuer: String(body.issuer ?? ""),
      number: String(body.number ?? ""),
      issueDate: String(body.issueDate ?? ""),
      expiryDate: String(body.expiryDate ?? ""),
      source,
      fileName: body.fileName ?? null,
      mime: body.mime ?? null,
      fileBase64: file ? file.toString("base64") : null,
    });
    return Response.json({ document }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
