import type { NextRequest } from "next/server";
import { DOC_TYPES, type DocType } from "@/lib/types";
import { decodeBase64File, errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const requestInfo = getStore().publicRequest(token);
    if (!requestInfo) return Response.json({ error: "This upload link is not active." }, { status: 404 });
    return Response.json({ request: requestInfo });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const body = (await request.json()) as {
      type?: string;
      holder?: string;
      issuer?: string;
      number?: string;
      issueDate?: string;
      expiryDate?: string;
      fileName?: string;
      mime?: string;
      dataBase64?: string;
    };
    const type = body.type as DocType;
    if (!DOC_TYPES.includes(type)) {
      return Response.json({ error: "Choose a document type." }, { status: 400 });
    }
    const file = body.dataBase64 ? decodeBase64File(body.dataBase64) : null;
    const saved = getStore().fulfillRequest(token, {
      type,
      holder: String(body.holder ?? ""),
      issuer: String(body.issuer ?? ""),
      number: String(body.number ?? ""),
      issueDate: String(body.issueDate ?? ""),
      expiryDate: String(body.expiryDate ?? ""),
      fileName: body.fileName ?? null,
      mime: body.mime ?? null,
      fileBase64: file ? file.toString("base64") : null,
    });
    return Response.json({ document: saved }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
