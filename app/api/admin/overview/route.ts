import type { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/actor";
import { errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    requireSuperadmin(request);
    return Response.json(getStore().adminOverview());
  } catch (error) {
    return errorResponse(error);
  }
}
