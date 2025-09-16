import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* ---------------- helpers ---------------- */

function extractThumbSrc(t) {
  if (!t) return null;
  const s = String(t).trim();
  if (!s) return null;
  if (s.startsWith("<img")) {
    const m = s.match(/src=["']([^"']+)["']/i);
    return m ? m[1] : null;
  }
  return s;
}

const cleanArr = (a) =>
  (Array.isArray(a) ? a : [a])
    .filter((v) => v !== undefined && v !== null)
    .map((v) => String(v).trim())
    .filter(Boolean);

function getAll(sp, key) {
  if (!sp) return [];
  if (typeof sp.getAll === "function") {
    const arr = sp.getAll(key);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  }
  const v = sp.get?.(key);
  if (!v) return [];
  return String(v).split(",").map((x) => x.trim()).filter(Boolean);
}

// raw SQL piece: (lower("col") = $1 OR lower("col") = $2 ...)
function ciEqOr(col, vals) {
  if (!vals?.length) return null;
  const lowered = vals.map((v) => v.toLowerCase());
  const pieces = lowered.map((val) =>
    Prisma.sql`lower(${Prisma.raw(`"${col}"`)}) = ${val}`
  );
  return Prisma.sql`(${Prisma.join(pieces, Prisma.raw(" OR "))})`;
}

const titleCase = (s) =>
  String(s || "")
    .trim().toLowerCase().replace(/\s+/g," ")
    .replace(/\b\w/g,(c)=>c.toUpperCase());

const GRADE_ALIASES = {
  "Pre-K": ["Pre-K","Pre K","Prek","PK","Prekindergarten"],
  "Kindergarten": ["Kindergarten","K","KG","Kinder","Kingdergardon"],
  "First Grade": ["First Grade","1st grade"],
  "Second Grade": ["Second Grade","2nd grade"],
  "Third Grade": ["Third Grade","3rd grade"],
  "Fourth Grade": ["Fourth Grade","4th grade"],
  "Fifth Grade": ["Fifth Grade","5th grade"],
  "Sixth Grade": ["Sixth Grade","6th grade"],
  "Seventh Grade": ["Seventh Grade","7th grade"],
  "Eighth Grade": ["Eighth Grade","8th grade"],
  "High School": ["High School"],
};

function normalizeGrade(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "";
  if (["pre k","pre-k","prek","pk","prekindergarten"].includes(s)) return "Pre-K";
  if (["k","kg","kinder","kindergarten","kingdergardon"].includes(s)) return "Kindergarten";
  const map = {
    "1st grade": "First Grade", "first grade": "First Grade",
    "2nd grade": "Second Grade", "second grade": "Second Grade",
    "3rd grade": "Third Grade", "third grade": "Third Grade",
    "4th grade": "Fourth Grade", "fourth grade": "Fourth Grade",
    "5th grade": "Fifth Grade", "fifth grade": "Fifth Grade",
    "6th grade": "Sixth Grade", "sixth grade": "Sixth Grade",
    "7th grade": "Seventh Grade", "seventh grade": "Seventh Grade",
    "8th grade": "Eighth Grade", "eighth grade": "Eighth Grade",
    "high school": "High School",
  };
  return map[s] || titleCase(raw);
}

function expandGradeAliases(values) {
  const out = new Set();
  for (const v of values || []) {
    const canon = normalizeGrade(v);
    (GRADE_ALIASES[canon] || [canon]).forEach((x) => out.add(x));
  }
  return Array.from(out);
}

/* Helper: OR group of lower(col) LIKE %q% across fields */
function buildQLikeGroup(qLower) {
  const like = `%${qLower}%`;
  return Prisma.sql`(
    lower("subject")   LIKE ${like} OR
    lower("topic")     LIKE ${like} OR
    lower("sub_topic") LIKE ${like} OR
    lower("grade")     LIKE ${like} OR
    lower("name")      LIKE ${like}
  )`;
}

/* --------------- main --------------- */

export async function POST(req) {
  try {
    let body = {};
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try { body = await req.json(); } catch { body = {}; }
    }

    const sp = new URL(req.url).searchParams;

    const qRaw = (body.q ?? sp.get("q") ?? "").toString().trim();
    const page = Number(body.page ?? sp.get("page") ?? 1);
    const pageSize = Number(body.pageSize ?? sp.get("pageSize") ?? 12);
    const seed = (body.seed ?? sp.get("seed") ?? "").toString();

    // Extract filters
    const subjectsIn = cleanArr(body.subjects ?? getAll(sp, "subjects")).map(titleCase);
    const gradesRaw  = cleanArr(body.grades ?? getAll(sp, "grades"));
    const topicsIn   = cleanArr(body.topics ?? getAll(sp, "topics")).map(titleCase);
    const subsIn     = cleanArr(body.sub_topics ?? getAll(sp, "sub_topics")).map(titleCase);

    // Grade alias expansion
    const gradesIn = expandGradeAliases(gradesRaw);

    const withAggregates = !!(body.withAggregates ?? (sp.get("withAggregates") === "1"));

    const qLower = qRaw.toLowerCase();
    const hasQ = qLower.length > 0;

    const limit = Math.min(50, Math.max(1, pageSize));

    // --------- Build a Prisma where object ONCE ----------
    const andFilters = [];
    if (subjectsIn.length) andFilters.push({ OR: subjectsIn.map((s) => ({ subject: { equals: s, mode: "insensitive" } })) });
    if (gradesIn.length)   andFilters.push({ OR: gradesIn.map((g) => ({ grade:   { equals: g, mode: "insensitive" } })) });
    if (topicsIn.length)   andFilters.push({ OR: topicsIn.map((t) => ({ topic:   { equals: t, mode: "insensitive" } })) });
    if (subsIn.length)     andFilters.push({ OR: subsIn.map((s) => ({ sub_topic:{ equals: s, mode: "insensitive" } })) });
    if (hasQ) {
      andFilters.push({
        OR: [
          { name: { contains: qRaw, mode: "insensitive" } },
          { subject: { contains: qRaw, mode: "insensitive" } },
          { grade: { contains: qRaw, mode: "insensitive" } },
          { topic: { contains: qRaw, mode: "insensitive" } },
          { sub_topic: { contains: qRaw, mode: "insensitive" } },
        ],
      });
    }
    const whereObj = andFilters.length ? { AND: andFilters } : {};

    // --- Build raw WHERE for ranked path ---
    const W = [];
    const subjOr = ciEqOr("subject", subjectsIn);
    const gradOr = ciEqOr("grade", gradesIn);
    const topicOr = ciEqOr("topic", topicsIn);
    const subOr   = ciEqOr("sub_topic", subsIn);
    if (subjOr) W.push(subjOr);
    if (gradOr) W.push(gradOr);
    if (topicOr) W.push(topicOr);
    if (subOr)   W.push(subOr);
    const WHERE_FILTERS_SQL = W.length ? Prisma.sql`${Prisma.join(W, Prisma.raw(" AND "))}` : Prisma.sql`TRUE`;
    const QLIKE_SQL = hasQ ? buildQLikeGroup(qLower) : null;

    // --------- Count ----------
    let total;
    if (hasQ) {
      const rows = await prisma.$queryRaw`
        SELECT COUNT(*)::int AS c
        FROM "Presentation"
        WHERE ${WHERE_FILTERS_SQL} AND ${QLIKE_SQL}
      `;
      total = Array.isArray(rows) && rows.length ? Number(rows[0].c) : 0;
    } else {
      total = await prisma.presentation.count({ where: whereObj });
    }

    // Paging base
    const pageNum = Math.max(1, Number(page) || 1);

    // Try ranked search when user typed something
    let itemsRaw = null;
    if (hasQ) {
      const offset = (pageNum - 1) * limit;
      try {
        itemsRaw = await prisma.$queryRaw`
          WITH candidates AS (
            SELECT
              id, slug, name, subject, grade, topic, sub_topic,
              thumbnail, thumbnail_alt_text, "createdAt",
              GREATEST(
                similarity(lower(subject), ${qLower}),
                similarity(lower(topic), ${qLower}),
                similarity(lower(sub_topic), ${qLower}),
                similarity(lower(grade), ${qLower}),
                similarity(lower(name), ${qLower})
              ) AS sim_max
            FROM "Presentation"
            WHERE ${WHERE_FILTERS_SQL} AND ${QLIKE_SQL}
            ORDER BY sim_max DESC
            LIMIT 2000
          ),
          ranked AS (
            SELECT
              id, slug, name, subject, grade, topic, sub_topic,
              thumbnail, thumbnail_alt_text, "createdAt",
              (
                (CASE WHEN lower(subject)   = ${qLower} THEN 6.0
                      WHEN lower(subject)   LIKE ${qLower + "%"} THEN 3.0
                      ELSE similarity(lower(subject),   ${qLower}) * 2.0 END) +
                (CASE WHEN lower(topic)     = ${qLower} THEN 5.0
                      WHEN lower(topic)     LIKE ${qLower + "%"} THEN 2.6
                      ELSE similarity(lower(topic),     ${qLower}) * 1.8 END) +
                (CASE WHEN lower(sub_topic) = ${qLower} THEN 4.5
                      WHEN lower(sub_topic) LIKE ${qLower + "%"} THEN 2.4
                      ELSE similarity(lower(sub_topic), ${qLower}) * 1.6 END) +
                (CASE WHEN lower(grade)     = ${qLower} THEN 2.5
                      WHEN lower(grade)     LIKE ${qLower + "%"} THEN 1.5
                      ELSE similarity(lower(grade),     ${qLower}) * 1.1 END) +
                (CASE WHEN lower(name)      = ${qLower} THEN 3.0
                      WHEN lower(name)      LIKE ${qLower + "%"} THEN 2.0
                      ELSE similarity(lower(name),      ${qLower}) * 1.3 END)
              ) AS score
            FROM candidates
          )
          SELECT id, slug, name, subject, grade, topic, sub_topic, thumbnail, thumbnail_alt_text
          FROM ranked
          ORDER BY score DESC, "createdAt" DESC, id ASC
          OFFSET ${offset} LIMIT ${limit};
        `;
      } catch {
        itemsRaw = null;
      }

      if (!itemsRaw) {
        itemsRaw = await prisma.presentation.findMany({
          where: whereObj,
          orderBy: [{ id: "asc" }],
          take: limit,
          skip: Math.max(0, (pageNum - 1) * limit),
          select: {
            id: true, slug: true, name: true,
            subject: true, grade: true, topic: true, sub_topic: true,
            thumbnail: true, thumbnail_alt_text: true,
          },
        });
      }
    } else {
      // --- NO-SEARCH PATH: seeded rotation with wrap-around ---
      if (total === 0) {
        itemsRaw = [];
      } else {
        let baseStart = 0;
        if (seed) {
          const windows = Math.max(1, total - limit + 1);
          const hash = Array.from(String(seed)).reduce(
            (h, c) => (h * 33 + c.charCodeAt(0)) >>> 0,
            5381
          );
          baseStart = hash % windows;
        }

        const displayedBefore = (pageNum - 1) * limit;
        const remaining = Math.max(0, total - displayedBefore);
        const pageSizeForThisPage = Math.min(limit, remaining);

        if (pageSizeForThisPage === 0) {
          itemsRaw = [];
        } else {
          const offsetPos = baseStart + displayedBefore;
          const offsetMod = offsetPos % total;

          const part1Count = Math.min(pageSizeForThisPage, total - offsetMod);
          const part2Count = pageSizeForThisPage - part1Count;

          const selectFields = {
            id: true, slug: true, name: true,
            subject: true, grade: true, topic: true, sub_topic: true,
            thumbnail: true, thumbnail_alt_text: true,
          };

          const tailPromise = prisma.presentation.findMany({
            where: whereObj,
            orderBy: { id: "asc" },
            skip: offsetMod,
            take: part1Count,
            select: selectFields,
          });

          if (part2Count > 0) {
            const [tailItems, headItems] = await Promise.all([
              tailPromise,
              prisma.presentation.findMany({
                where: whereObj,
                orderBy: { id: "asc" },
                skip: 0,
                take: part2Count,
                select: selectFields,
              }),
            ]);
            itemsRaw = tailItems.concat(headItems);
          } else {
            itemsRaw = await tailPromise;
          }
        }
      }
    }

    const items = (itemsRaw || []).map((i) => ({
      ...i,
      thumbnail: extractThumbSrc(i.thumbnail),
    }));

    // Aggregates (optional)
    let aggregates = null;
    if (withAggregates) {
      const [subjectsAgg, gradesAgg, topicsAgg, subtopicsAgg] = await Promise.all([
        prisma.presentation.groupBy({ by: ["subject"], _count: { _all: true } }),
        prisma.presentation.groupBy({ by: ["grade"], _count: { _all: true } }),
        prisma.presentation.groupBy({ by: ["topic"], _count: { _all: true } }),
        prisma.presentation.groupBy({ by: ["sub_topic"], _count: { _all: true } }),
      ]);

      const tidy = (s) => String(s || "").trim();

      aggregates = {
        subjects: subjectsAgg
          .map((s) => ({ name: titleCase(s.subject), count: s._count._all }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        grades: gradesAgg
          .map((g) => ({ name: normalizeGrade(g.grade), count: g._count._all }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        topics: topicsAgg
          .filter((t) => tidy(t.topic))
          .map((t) => ({ name: t.topic, count: t._count._all }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        sub_topics: subtopicsAgg
          .filter((s) => tidy(s.sub_topic))
          .map((s) => ({ name: s.sub_topic, count: s._count._all }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      };
    }

    return new Response(JSON.stringify({ total, items, aggregates }), { status: 200 });
  } catch (e) {
    console.error("search error", e);
    return new Response(JSON.stringify({ total: 0, items: [], aggregates: null }), { status: 500 });
  }
}

export async function GET(req) {
  const url = new URL(req.url, "http://localhost");
  const sp = url.searchParams;
  const proxyBody = {
    q: sp.get("q") || "",
    page: Number(sp.get("page") || 1),
    pageSize: Number(sp.get("pageSize") || 12),
    subjects: getAll(sp, "subjects"),
    grades: getAll(sp, "grades"),
    topics: getAll(sp, "topics"),
    sub_topics: getAll(sp, "sub_topics"),
    withAggregates: sp.get("withAggregates") === "1",
    seed: sp.get("seed") || "",
  };
  return POST(
    new Request(req.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(proxyBody),
    })
  );
}
