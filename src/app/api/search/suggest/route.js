// api/search/suggest/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  // If query is empty or very short, return a random sample of presentations
  if (!q || q.length < 2) {
    const fallback = await getRandomizedSample(12);
    return NextResponse.json({ items: fallback });
  }

  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 5);

  // 1. Exact match on topic
  const exactTopic = await prisma.presentation.findMany({
    where: { topic: { equals: q, mode: "insensitive" } },
    select: baseSelect,
    take: 24,
  });

  // 2. Exact match on sub_topic
  const exactSubtopic = await prisma.presentation.findMany({
    where: { sub_topic: { equals: q, mode: "insensitive" } },
    select: baseSelect,
    take: 24,
  });

  // 3. Exact match on grade
  const exactGrade = await prisma.presentation.findMany({
    where: { grade: { equals: q, mode: "insensitive" } },
    select: baseSelect,
    take: 24,
  });

  // 4. Exact match on subject
  const exactSubject = await prisma.presentation.findMany({
    where: { subject: { equals: q, mode: "insensitive" } },
    select: baseSelect,
    take: 24,
  });

  // 5. All tokens appear in topic
  const topicAnd = tokens.length ? await prisma.presentation.findMany({
    where: {
      AND: tokens.map((t) => ({
        topic: { contains: t, mode: "insensitive" },
      })),
    },
    select: baseSelect,
    take: 24,
  }) : [];

  // 6. All tokens appear in sub_topic
  const subtopicAnd = tokens.length ? await prisma.presentation.findMany({
    where: {
      AND: tokens.map((t) => ({
        sub_topic: { contains: t, mode: "insensitive" },
      })),
    },
    select: baseSelect,
    take: 24,
  }) : [];

  // 7. All tokens appear in grade
  const gradeAnd = tokens.length ? await prisma.presentation.findMany({
    where: {
      AND: tokens.map((t) => ({
        grade: { contains: t, mode: "insensitive" },
      })),
    },
    select: baseSelect,
    take: 24,
  }) : [];

  // 8. All tokens appear in subject
  const subjectAnd = tokens.length ? await prisma.presentation.findMany({
    where: {
      AND: tokens.map((t) => ({
        subject: { contains: t, mode: "insensitive" },
      })),
    },
    select: baseSelect,
    take: 24,
  }) : [];

  // 9. Any token appears in topic, sub_topic, grade, subject, name, or presentation_content
  const relatedOr = tokens.length ? await prisma.presentation.findMany({
    where: {
      OR: tokens.flatMap((t) => [
        { topic: { contains: t, mode: "insensitive" } },
        { sub_topic: { contains: t, mode: "insensitive" } },
        { grade: { contains: t, mode: "insensitive" } },
        { subject: { contains: t, mode: "insensitive" } },
        { name: { contains: t, mode: "insensitive" } },
        { presentation_content: { contains: t, mode: "insensitive" } },
      ]),
    },
    select: baseSelect,
    take: 24,
  }) : [];

  // Merge results in priority order and remove duplicates
  const merged = dedupeById([
    ...exactTopic,
    ...exactSubtopic,
    ...exactGrade,
    ...exactSubject,
    ...topicAnd,
    ...subtopicAnd,
    ...gradeAnd,
    ...subjectAnd,
    ...relatedOr,
  ]);

  // Return top results (up to 12 items), or empty if no matches
  const resultItems = merged.slice(0, 12).map(mapItem);
  return NextResponse.json({ items: resultItems });
}

/* Helper functions */

// Map presentation to suggestion item format
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

// Remove duplicates by presentation ID, keeping first occurrence
function dedupeById(arr) {
  const seen = new Set();
  return arr.filter((x) => {
    if (!x || seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

// Shuffle an array (Fisher–Yates algorithm)
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Get a randomized sample of presentations (for fallback results)
async function getRandomizedSample(take = 12) {
  const pool = await prisma.presentation.findMany({
    select: baseSelect,
    take: Math.max(take * 4, 40),
    orderBy: { id: "desc" },
  });
  return shuffle(pool).slice(0, take).map(mapItem);
}
