import type { NextRequest } from "next/server";
import { requireActor } from "@/lib/actor";
import { errorResponse } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const actor = requireActor(request);
    return Response.json({
      user: actor.user,
      org: actor.org
        ? { id: actor.org.id, name: actor.org.name, slug: actor.org.slug, plan: actor.org.plan }
        : null,
      readOnly: actor.readOnly,
      role: actor.membership?.role ?? null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
