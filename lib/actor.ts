import type { NextRequest } from "next/server";
import { HttpError, readRequestSession } from "@/lib/http";
import { assertWrite, getStore } from "@/lib/store";
import type { Actor } from "@/lib/types";

export function actorFromRequest(request: NextRequest): Actor | null {
  const session = readRequestSession(request);
  if (!session) return null;
  return getStore().toActor(session);
}

export function requireActor(request: NextRequest) {
  const actor = actorFromRequest(request);
  if (!actor) throw new HttpError(401, "Sign in to continue.");
  return actor;
}

export function requireOrgActor(request: NextRequest) {
  const actor = requireActor(request);
  if (!actor.org || !actor.membership) {
    throw new HttpError(403, "This account has no organization vault.");
  }
  return actor as Actor & { org: NonNullable<Actor["org"]>; membership: NonNullable<Actor["membership"]> };
}

export function requireWriter(request: NextRequest) {
  const actor = requireOrgActor(request);
  assertWrite(actor);
  return actor;
}

export function requireSuperadmin(request: NextRequest) {
  const actor = requireActor(request);
  if (actor.user.platformRole !== "superadmin") {
    throw new HttpError(403, "Platform admin only.");
  }
  return actor;
}
