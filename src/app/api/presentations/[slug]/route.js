import { prisma } from "@/lib/prisma";

export async function GET(_req, context) {
  const { slug } = await context.params; // ✅ must await params
  const item = await prisma.presentation.findFirst({ where: { slug } });
  if (!item) return new Response("Not found", { status: 404 });
  return Response.json(item);
}
