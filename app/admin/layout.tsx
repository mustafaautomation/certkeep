import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const session = verifySession(jar.get(SESSION_COOKIE)?.value);
  const actor = session ? getStore().toActor(session) : null;
  if (!actor) redirect("/login");
  if (actor.user.platformRole !== "superadmin") redirect("/app");
  return children;
}
