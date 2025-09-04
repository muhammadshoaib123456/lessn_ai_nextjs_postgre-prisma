import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  // Split into keywords; AND match in topic (case-insensitive)
  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 5);

  const items = await prisma.presentation.findMany({
    where: {
      AND: tokens.map((t) => ({
        topic: { contains: t, mode: "insensitive" },
      })),
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
    take: 12, // fetch a few extra so client can pick top 4
  });

  const mapped = items.map((i) => ({
    id: i.id,
    slug: i.slug,
    title: i.name,
    subject: i.subject,
    grade: i.grade,
    topic: i.topic,
    subtopic: i.sub_topic,
    snippet: i.presentation_content ? i.presentation_content.slice(0, 200) : "",
  }));

  return NextResponse.json({ items: mapped });
}
