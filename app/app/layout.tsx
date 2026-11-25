import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function VaultLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const session = verifySession(jar.get(SESSION_COOKIE)?.value);
  const actor = session ? getStore().toActor(session) : null;
  if (!actor) redirect("/login");
  if (actor.readOnly) redirect("/demo");
  if (!actor.org) redirect("/admin");
  return (
    <Shell orgName={actor.org.name} plan={actor.org.plan} userName={actor.user.name}>
      {children}
    </Shell>
  );
}
