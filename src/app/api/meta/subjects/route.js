export const revalidate = 3600;

import { prisma } from "@/lib/prisma";

const titleCase = (s) =>
  String(s || "")
    .trim().toLowerCase().replace(/\s+/g," ")
    .replace(/\b\w/g,(c)=>c.toUpperCase());

const GRADE_ALIASES = {
  "Pre-K":["Pre-K","Pre K","Prek","PK","Prekindergarten"],
  "Kindergarten":["Kindergarten","K","KG","Kinder","Kingdergardon"],
  "First Grade":["First Grade","1st grade"],
  "Second Grade":["Second Grade","2nd grade"],
  "Third Grade":["Third Grade","3rd grade"],
  "Fourth Grade":["Fourth Grade","4th grade"],
  "Fifth Grade":["Fifth Grade","5th grade"],
  "Sixth Grade":["Sixth Grade","6th grade"],
  "Seventh Grade":["Seventh Grade","7th grade"],
  "Eighth Grade":["Eighth Grade","8th grade"],
  "High School":["High School"],
};

function getAll(sp, key) {
  const all = sp.getAll(key);
  const out = [];
  for (const v of all) {
    String(v || "").split(",").map((x)=>x.trim()).filter(Boolean).forEach((x)=>out.push(x));
  }
  return out;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const grades = getAll(searchParams, "grades");

  let where;
  if (grades.length > 0) {
    const ors = [];
    for (const g of grades) {
      const canon = titleCase(g);
      const aliases = GRADE_ALIASES[canon] || [canon];
      for (const alias of aliases) {
        ors.push({ grade: { equals: alias, mode: "insensitive" } });
      }
    }
    where = { OR: ors };
  }

  const rows = await prisma.presentation.groupBy({
    by: ["subject"],
    _count: { _all: true },
    where,
  });

  const set = new Map();
  for (const r of rows) {
    const t = titleCase(r.subject);
    if (!t) continue;
    const key = t.toLowerCase();
    set.set(key, { name: t, count: (set.get(key)?.count || 0) + (r?._count?._all || 0) });
  }

  const list = Array.from(set.values()).sort((a, b) => a.name.localeCompare(b.name));
  return new Response(JSON.stringify(list), { status: 200 });
}
