import type { NextRequest } from "next/server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  await context.params;
  void request.method;
  return Response.json({ error: "Audit entries are append-only." }, { status: 405 });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  await context.params;
  void request.method;
  return Response.json({ error: "Audit entries are append-only." }, { status: 405 });
}
