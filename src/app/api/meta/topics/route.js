import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Prisma singleton for Next.js dev hot-reload
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * GET /api/meta/topics
 *   all:                        /api/meta/topics
 *   filter by subjects/grades:  ?subjects=Math,Science&grades=First Grade,Second Grade
 *   (also supports repeated params) subjects=A&subjects=B
 *   search within topics:       ?q=alge
 *   limit:                      ?limit=200
 *
 * Returns [{ name: "Algebra", count: 123 }, ...]
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

    const q = (sp.get("q") || "").trim().toLowerCase();
    const limitRaw = Number(sp.get("limit") || 500);
    const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 500, 1000);

    // NEW: optional filters
    const subjects = readList(sp, "subjects");
    const grades = readList(sp, "grades");

    // Build a safe where clause
    const where = {
      AND: [
        { NOT: [{ topic: null }, { topic: "" }] },
      ],
    };

    if (subjects.length) {
      // case-insensitive match
      where.AND.push({ subject: { in: subjects, mode: "insensitive" } });
    }
    if (grades.length) {
      where.AND.push({ grade: { in: grades, mode: "insensitive" } });
    }
    if (q) {
      where.AND.push({ topic: { contains: q, mode: "insensitive" } });
    }

    const grouped = await prisma.presentation.groupBy({
      by: ["topic"],
      where,
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
