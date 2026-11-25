import { integrationStatus } from "@/lib/mode";
import { supabasePublicEnv } from "@/lib/supabase/server";

export async function GET() {
  const status = integrationStatus();
  return Response.json({
    ok: true,
    ...status,
    supabaseReachable: Boolean(supabasePublicEnv()),
  });
}
