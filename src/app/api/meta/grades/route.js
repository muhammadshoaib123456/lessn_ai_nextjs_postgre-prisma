export const revalidate = 3600;

import { prisma } from "@/lib/prisma";

const ORDER = [
  "Pre-K","Kindergarten","First Grade","Second Grade","Third Grade",
  "Fourth Grade","Fifth Grade","Sixth Grade","Seventh Grade","Eighth Grade","High School",
];

const titleCase = (s) =>
  String(s || "")
    .trim().toLowerCase().replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function normalizeGrade(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "";
  if (["pre k","pre-k","prek","pk","prekindergarten"].includes(s)) return "Pre-K";
  if (["k","kg","kinder","kindergarten","kingdergardon"].includes(s)) return "Kindergarten";
  const map = {
    "1st grade":"First Grade","first grade":"First Grade",
    "2nd grade":"Second Grade","second grade":"Second Grade",
    "3rd grade":"Third Grade","third grade":"Third Grade",
    "4th grade":"Fourth Grade","fourth grade":"Fourth Grade",
    "5th grade":"Fifth Grade","fifth grade":"Fifth Grade",
    "6th grade":"Sixth Grade","sixth grade":"Sixth Grade",
    "7th grade":"Seventh Grade","seventh grade":"Seventh Grade",
    "8th grade":"Eighth Grade","eighth grade":"Eighth Grade",
    "high school":"High School",
  };
  return map[s] || titleCase(raw);
}

function getAll(sp, key) {
  const all = sp.getAll(key);
  const out = [];
  for (const v of all) {
    String(v || "").split(",").map((x) => x.trim()).filter(Boolean).forEach((x) => out.push(x));
  }
  return out;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const subjects = getAll(searchParams, "subjects");

  const where =
    subjects.length > 0
      ? {
          OR: subjects.map((s) => ({ subject: { equals: s, mode: "insensitive" } })),
        }
      : undefined;

  const rows = await prisma.presentation.groupBy({
    by: ["grade"],
    _count: { _all: true },
    where,
  });

  const combined = new Map();
  for (const r of rows) {
    const canon = normalizeGrade(r.grade);
    if (!canon) continue;
    const prev = combined.get(canon) || { name: canon, count: 0 };
    combined.set(canon, { name: canon, count: prev.count + (r?._count?._all || 0) });
  }

  const list = Array.from(combined.values()).sort((a, b) => {
    const ia = ORDER.indexOf(a.name);
    const ib = ORDER.indexOf(b.name);
    if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return new Response(JSON.stringify(list), { status: 200 });
}
