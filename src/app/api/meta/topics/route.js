export const revalidate = 3600;

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const titleCase = (s) =>
  String(s || "").trim().toLowerCase().replace(/\s+/g," ").replace(/\b\w/g,(c)=>c.toUpperCase());

const GRADE_ALIASES = {
  "Pre-K": ["Pre-K","Pre K","Prek","PK","Prekindergarten"],
  Kindergarten: ["Kindergarten","K","KG","Kinder","Kingdergardon"],
  "First Grade": ["First Grade","1st grade"],
  "Second Grade": ["Second Grade","2nd grade"],
  "Third Grade": ["Third Grade","3rd grade"],
  "Fourth Grade": ["Fourth Grade","4th grade"],
  "Fifth Grade": ["Fifth Grade","5th grade"],
  "Sixth Grade": ["Sixth Grade","6th grade"],
  "Seventh Grade": ["Seventh Grade","7th grade"],
  "Eighth Grade": ["Eighth Grade","8th grade"],
  "High School": ["High School"],
};

function readList(sp, key) {
  const repeated = typeof sp.getAll === "function" ? sp.getAll(key) : [];
  const csv = (sp.get(key) || "").trim();
  if (repeated && repeated.length) {
    return repeated.flatMap((v) => String(v).split(",")).map((s) => s.trim()).filter(Boolean);
  }
  if (csv) {
    return csv.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function buildCIEqualsOr(field, values) {
  const vals = (values || []).filter(Boolean);
  if (!vals.length) return null;
  return { OR: vals.map((v) => ({ [field]: { equals: v, mode: "insensitive" } })) };
}

function expandGradeAliases(values) {
  const out = new Set();
  for (const v of values || []) {
    const canon = titleCase(v);
    const aliases = GRADE_ALIASES[canon] || [canon];
    aliases.forEach((x) => out.add(x));
  }
  return Array.from(out);
}

export async function GET(req) {
  try {
    const sp = req.nextUrl?.searchParams || new URL(req.url).searchParams;

    const q = (sp.get("q") || "").trim().toLowerCase();
    const limitRaw = Number(sp.get("limit") || 500);
    const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 500, 1000);

    const subjects = readList(sp, "subjects");
    const gradesIn = readList(sp, "grades");

    const whereAnd = [{ NOT: [{ topic: null }, { topic: "" }] }];

    const subjOr = buildCIEqualsOr("subject", subjects);
    if (subjOr) whereAnd.push(subjOr);

    const gradesExpanded = expandGradeAliases(gradesIn);
    const gradeOr = buildCIEqualsOr("grade", gradesExpanded);
    if (gradeOr) whereAnd.push(gradeOr);

    if (q) whereAnd.push({ topic: { contains: q, mode: "insensitive" } });

    const grouped = await prisma.presentation.groupBy({
      by: ["topic"],
      where: { AND: whereAnd },
      _count: { _all: true },
      orderBy: { topic: "asc" },
    });

    const rows = grouped
      .map((r) => ({ name: titleCase(r.topic), count: r._count._all }))
      .filter((r) => r.name && r.name.trim().length > 0);

    return NextResponse.json(rows.slice(0, limit));
  } catch (err) {
    console.error("GET /api/meta/topics error:", err);
    return NextResponse.json({ error: "Failed to load topics" }, { status: 500 });
  }
}
