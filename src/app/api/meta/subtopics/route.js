import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Prisma singleton for Next.js dev hot-reload
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * GET /api/meta/subtopics
 *   all:                        /api/meta/subtopics
 *   by topics (CSV or repeated):?topics=Algebra,Geometry OR ?topics=Algebra&topics=Geometry
 *   filter by subjects/grades:  ?subjects=Math&grades=First Grade
 *   search within subtopics:    ?q=lin
 *   limit:                      ?limit=200
 *
 * Returns [{ name: "Linear Equations", count: 42 }, ...]
 */

const titleCase = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Read list params, supporting CSV and repeated keys
function readList(sp, key) {
  const repeated = typeof sp.getAll === "function" ? sp.getAll(key) : [];
  const csv = (sp.get(key) || "").trim();

  if (repeated && repeated.length) {
    return repeated
      .flatMap((v) => String(v).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (csv) {
    return csv.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export async function GET(req) {
  try {
    const sp = req.nextUrl?.searchParams || new URL(req.url).searchParams;

    const topics = readList(sp, "topics");     // optional
    const subjects = readList(sp, "subjects"); // optional
    const grades = readList(sp, "grades");     // optional

    const q = (sp.get("q") || "").trim().toLowerCase();
    const limitRaw = Number(sp.get("limit") || 500);
    const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 500, 1000);

    const where = {
      AND: [
        { NOT: [{ sub_topic: null }, { sub_topic: "" }] },
      ],
    };

    if (subjects.length) where.AND.push({ subject: { in: subjects, mode: "insensitive" } });
    if (grades.length) where.AND.push({ grade: { in: grades, mode: "insensitive" } });
    if (topics.length) where.AND.push({ topic: { in: topics, mode: "insensitive" } });
    if (q) where.AND.push({ sub_topic: { contains: q, mode: "insensitive" } });

    const grouped = await prisma.presentation.groupBy({
      by: ["sub_topic"],
      where,
      _count: { _all: true },
      orderBy: { sub_topic: "asc" },
    });

    const rows = grouped
      .map((r) => ({ name: titleCase(r.sub_topic), count: r._count._all }))
      .filter((r) => r.name && r.name.trim().length > 0);

    return NextResponse.json(rows.slice(0, limit));
  } catch (err) {
    console.error("GET /api/meta/subtopics error:", err);
    return NextResponse.json({ error: "Failed to load sub-topics" }, { status: 500 });
  }
}
