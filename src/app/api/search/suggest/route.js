// api/search/suggest
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q || q.length < 2) {
    const fallback = await getRandomizedSample(12);
    return NextResponse.json({ items: fallback });
  }

  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 5);

  // --- PRIORITY ORDER ---
  // 1) STRICT topic === q
  const exactTopic = await prisma.presentation.findMany({
    where: { topic: { equals: q, mode: "insensitive" } },
    select: baseSelect,
    take: 24,
  });

  // 2) TOPIC: AND match across tokens
  const topicAnd = tokens.length
    ? await prisma.presentation.findMany({
        where: {
          AND: tokens.map((t) => ({
            topic: { contains: t, mode: "insensitive" },
          })),
        },
        select: baseSelect,
        take: 24,
      })
    : [];

  // 3) STRICT sub_topic === q
  const exactSubtopic = await prisma.presentation.findMany({
    where: { sub_topic: { equals: q, mode: "insensitive" } },
    select: baseSelect,
    take: 24,
  });

  // 4) SUBTOPIC: AND match across tokens
  const subtopicAnd = tokens.length
    ? await prisma.presentation.findMany({
        where: {
          AND: tokens.map((t) => ({
            sub_topic: { contains: t, mode: "insensitive" },
          })),
        },
        select: baseSelect,
        take: 24,
      })
    : [];

  // 5) RELATED: OR across topic/sub_topic/subject/name
  const relatedOr = tokens.length
    ? await prisma.presentation.findMany({
        where: {
          OR: tokens.flatMap((t) => [
            { topic: { contains: t, mode: "insensitive" } },
            { sub_topic: { contains: t, mode: "insensitive" } },
            { subject: { contains: t, mode: "insensitive" } },
            { name: { contains: t, mode: "insensitive" } },
          ]),
        },
        select: baseSelect,
        take: 24,
      })
    : [];

  // Merge by priority & dedupe
  const merged = dedupeById([
    ...exactTopic,
    ...topicAnd,
    ...exactSubtopic,
    ...subtopicAnd,
    ...relatedOr,
  ]);

  // Fallback: randomized sample (never empty)
  const finalPool =
    merged.length > 0
      ? merged.slice(0, 24)
      : await prisma.presentation.findMany({
          select: baseSelect,
          take: 60,
          orderBy: { id: "desc" },
        });

  const result = (merged.length > 0 ? finalPool : shuffle(finalPool))
    .slice(0, 12)
    .map(mapItem);

  return NextResponse.json({ items: result });
}

/* ---------------------- helpers ---------------------- */

const baseSelect = {
  id: true,
  slug: true,
  name: true,
  subject: true,
  grade: true,
  topic: true,
  sub_topic: true,
  presentation_content: true,
};

function mapItem(i) {
  return {
    id: i.id,
    slug: i.slug,
    title: i.name,
    subject: i.subject,
    grade: i.grade,
    topic: i.topic,
    subtopic: i.sub_topic,
    snippet: i.presentation_content ? String(i.presentation_content).slice(0, 200) : "",
  };
}

function dedupeById(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (x && !seen.has(x.id)) {
      seen.add(x.id);
      out.push(x);
    }
  }
  return out;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function getRandomizedSample(take = 12) {
  const pool = await prisma.presentation.findMany({
    select: baseSelect,
    take: Math.max(take * 4, 40),
    orderBy: { id: "desc" },
  });
  return shuffle(pool).slice(0, take).map(mapItem);
}
