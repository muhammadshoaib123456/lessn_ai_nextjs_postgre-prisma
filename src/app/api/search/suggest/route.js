// src/app/api/search/suggest/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const items = await prisma.presentation.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { grade: { contains: q, mode: "insensitive" } },
        { topic: { contains: q, mode: "insensitive" } },
        { sub_topic: { contains: q, mode: "insensitive" } },
        { presentation_content: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      subject: true,
      grade: true,
      topic: true,
      sub_topic: true,
      presentation_content: true,
    },
    take: 8, // top 8 matches
  });

  const mapped = items.map((i) => ({
    id: i.id,
    slug: i.slug,
    title: i.name,
    subject: i.subject,
    grade: i.grade,
    topic: i.topic,
    subtopic: i.sub_topic,
    snippet: i.presentation_content
      ? i.presentation_content.slice(0, 120)
      : "",
  }));

  return NextResponse.json({ items: mapped });
}
