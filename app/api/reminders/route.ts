import type { NextRequest } from "next/server";
import { requireOrgActor, requireWriter } from "@/lib/actor";
import { errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const actor = requireOrgActor(request);
    return Response.json(getStore().reminderBoard(actor.org.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = requireWriter(request);
    const result = getStore().sweepReminders(actor.org.id, actor.user.id);
    return Response.json({ ...result, ...getStore().reminderBoard(actor.org.id) });
  } catch (error) {
    return errorResponse(error);
  }
}
