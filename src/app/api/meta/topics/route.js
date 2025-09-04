import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Prisma singleton for Next.js dev hot-reload
const globalForPrisma = globalThis;
export const prisma =
  globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * GET /api/meta/topics?q=alge&limit=200
 * Returns [{ name: "Algebra", count: 123 }, ...]
 */
export async function GET(req) {
  try {
    const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;

    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const limitRaw = Number(searchParams.get("limit") || 500);
    const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 500, 1000);

    const grouped = await prisma.presentation.groupBy({
      by: ["topic"],
      _count: { _all: true },
      where: {
        NOT: [{ topic: null }, { topic: "" }],
      },
      orderBy: { topic: "asc" },
    });

    const rows = grouped
      .map((r) => ({ name: String(r.topic), count: r._count._all }))
      .filter((r) => r.name.trim().length > 0);

    const filtered = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;

    return NextResponse.json(filtered.slice(0, limit));
  } catch (err) {
    console.error("GET /api/meta/topics error:", err);
    return NextResponse.json({ error: "Failed to load topics" }, { status: 500 });
  }
}
