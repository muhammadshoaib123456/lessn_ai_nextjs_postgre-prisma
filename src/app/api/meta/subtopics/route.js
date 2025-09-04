import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Prisma singleton for Next.js dev hot-reload
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * GET /api/meta/subtopics
 *   all:                      /api/meta/subtopics
 *   by topics (CSV or repeated):
 *       /api/meta/subtopics?topics=Algebra,Geometry
 *       /api/meta/subtopics?topics=Algebra&topics=Geometry
 *   search within subtopics:  ?q=lin
 *   limit:                    ?limit=200
 *
 * Returns [{ name: "Linear Equations", count: 42 }, ...]
 */
export async function GET(req) {
  try {
    const sp = req.nextUrl?.searchParams || new URL(req.url).searchParams;

    // Accept repeated topics or CSV; Next already decodes values
    const repeated = typeof sp.getAll === "function" ? sp.getAll("topics") : [];
    const csv = (sp.get("topics") || "").trim();

    let topics = [];
    if (repeated && repeated.length) {
      topics = repeated.map((s) => String(s).trim()).filter(Boolean);
    } else if (csv) {
      topics = csv.split(",").map((s) => String(s).trim()).filter(Boolean);
    }

    const q = (sp.get("q") || "").trim().toLowerCase();
    const limitRaw = Number(sp.get("limit") || 500);
    const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 500, 1000);

    const where = {
      NOT: [{ sub_topic: null }, { sub_topic: "" }],
      ...(topics.length ? { topic: { in: topics } } : {}),
    };

    const grouped = await prisma.presentation.groupBy({
      by: ["sub_topic"],
      _count: { _all: true },
      where,
      orderBy: { sub_topic: "asc" },
    });

    const rows = grouped
      .map((r) => ({ name: String(r.sub_topic), count: r._count._all }))
      .filter((r) => r.name.trim().length > 0);

    const filtered = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;

    return NextResponse.json(filtered.slice(0, limit));
  } catch (err) {
    console.error("GET /api/meta/subtopics error:", err);
    return NextResponse.json({ error: "Failed to load sub-topics" }, { status: 500 });
  }
}
