export const revalidate = 3600;

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const titleCase = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

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

export async function GET(req) {
  try {
    const sp = req.nextUrl?.searchParams || new URL(req.url).searchParams;

    const q = (sp.get("q") || "").trim().toLowerCase();
    const limitRaw = Number(sp.get("limit") || 500);
    const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 500, 1000);

    const subjects = readList(sp, "subjects");
    const grades = readList(sp, "grades");

    const where = { AND: [{ NOT: [{ topic: null }, { topic: "" }] }] };
    if (subjects.length) where.AND.push({ subject: { in: subjects, mode: "insensitive" } });
    if (grades.length) where.AND.push({ grade: { in: grades, mode: "insensitive" } });
    if (q) where.AND.push({ topic: { contains: q, mode: "insensitive" } });

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
