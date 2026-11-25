import type { NextRequest } from "next/server";
import { requireOrgActor } from "@/lib/actor";
import { errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = requireOrgActor(request);
    const { id } = await context.params;
    const file = getStore().getFile(actor.org.id, id);
    if (!file) return Response.json({ error: "File not found." }, { status: 404 });
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": file.mime,
        "Content-Disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
