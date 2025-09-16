// app/api/presentations/slider/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SELECT = {
  id: true,
  slug: true,
  name: true,
  subject: true,
  grade: true,
  topic: true,
  sub_topic: true,
  thumbnail: true,
  thumbnail_alt_text: true,
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "24", 10)));
    let offset = parseInt(searchParams.get("offset") || "0", 10);

    const total = await prisma.presentation.count();
    if (total === 0) {
      return NextResponse.json({ items: [], offset: 0, count: 0 });
    }

    // Normalize offset into [0..total-1]
    offset = ((offset % total) + total) % total;

    let rows = [];
    if (offset + limit <= total) {
      rows = await prisma.presentation.findMany({
        orderBy: { id: "asc" },
        skip: offset,
        take: limit,
        select: SELECT,
      });
    } else {
      const takeA = total - offset;
      const a = await prisma.presentation.findMany({
        orderBy: { id: "asc" },
        skip: offset,
        take: takeA,
        select: SELECT,
      });
      const b = await prisma.presentation.findMany({
        orderBy: { id: "asc" },
        skip: 0,
        take: limit - takeA,
        select: SELECT,
      });
      rows = [...a, ...b];
    }

    const items = rows.map((r) => ({ ...r, subtopic: r.sub_topic ?? null }));

    return NextResponse.json({
      items,
      offset,
      count: total,
    });
  } catch (e) {
    console.error("slider API error", e);
    return NextResponse.json({ items: [], offset: 0, count: 0 }, { status: 500 });
    }
}
