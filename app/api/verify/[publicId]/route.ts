import { getStore } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  const profile = getStore().publicProfile(publicId);
  if (!profile) return Response.json({ error: "No public record for that vendor." }, { status: 404 });
  return Response.json({ profile });
}
