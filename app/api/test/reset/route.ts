import { errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function POST() {
  if (process.env.VERCEL || process.env.E2E !== "1") {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  try {
    getStore().reset();
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
