import { prisma } from "@/lib/prisma";

export async function GET(_req, { params }) {
  const slug = params.slug;
  const item = await prisma.presentation.findFirst({ where: { slug } });
  if (!item) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(item), { status: 200 });
}
