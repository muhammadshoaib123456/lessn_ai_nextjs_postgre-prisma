import { prisma } from "@/lib/prisma";

function extractThumbSrc(t) {
  if (!t) return null;
  const s = String(t).trim();
  if (!s) return null;
  if (s.startsWith("<img")) {
    const m = s.match(/src=["']([^"']+)["']/i);
    return m ? m[1] : null;
  }
  return s;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || 12);

  const raw = await prisma.presentation.findMany({
    orderBy: [{ rating: "desc" }, { reviews: "desc" }],
    take: limit,
    select: {
      id: true, slug: true, name: true, subject: true, grade: true,
      topic: true, sub_topic: true, thumbnail: true, thumbnail_alt_text: true
    }
  });

  const items = raw.map(i => ({
    ...i,
    thumbnail: extractThumbSrc(i.thumbnail),
  }));

  return new Response(JSON.stringify({ items }), { status: 200 });
}
