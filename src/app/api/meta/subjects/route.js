export const revalidate = 3600;

import { prisma } from "@/lib/prisma";

const titleCase = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export async function GET() {
  const rows = await prisma.presentation.groupBy({ by: ["subject"], _count: { subject: true } });

  const set = new Map();
  for (const r of rows) {
    const t = titleCase(r.subject);
    if (t) {
      const key = t.toLowerCase();
      set.set(key, { name: t, count: (set.get(key)?.count || 0) + r._count.subject });
    }
  }

  const list = Array.from(set.values()).sort((a, b) => a.name.localeCompare(b.name));
  return new Response(JSON.stringify(list), { status: 200 });
}
