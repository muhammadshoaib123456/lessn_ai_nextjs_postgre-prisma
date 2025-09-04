import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* -------------------- helpers -------------------- */

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

// build `(lower("col") = $1 OR lower("col") = $2 ...)` for raw SQL path
function ciEqOr(col, vals) {
  if (!vals?.length) return null;
  const lowered = vals.map((v) => v.toLowerCase());
  const pieces = lowered.map((val) =>
    Prisma.sql`lower(${Prisma.raw(`"${col}"`)}) = ${val}`
  );
  return Prisma.sql`(${Prisma.join(pieces, Prisma.raw(" OR "))})`;
}

/* ---- grade normalization (same logic as /api/meta/grades) ---- */
const titleCase = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function normalizeGrade(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "";
  if (["pre k", "pre-k", "prek", "pk", "prekindergarten"].includes(s)) return "Pre-K";
  if (["k", "kg", "kinder", "kindergarten", "kingdergardon"].includes(s)) return "Kindergarten";
  const map = {
    "1st grade": "First Grade",
    "first grade": "First Grade",
    "2nd grade": "Second Grade",
    "second grade": "Second Grade",
    "3rd grade": "Third Grade",
    "third grade": "Third Grade",
    "4th grade": "Fourth Grade",
    "fourth grade": "Fourth Grade",
    "5th grade": "Fifth Grade",
    "fifth grade": "Fifth Grade",
    "6th grade": "Sixth Grade",
    "sixth grade": "Sixth Grade",
    "7th grade": "Seventh Grade",
    "seventh grade": "Seventh Grade",
    "8th grade": "Eighth Grade",
    "eighth grade": "Eighth Grade",
    "high school": "High School",
  };
  return map[s] || titleCase(raw);
}

/* -------------------- main handler -------------------- */

export async function POST(req) {
  try {
    // Parse JSON body if present, otherwise allow POST with no body (prefetchers)
    let body = {};
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    // Also accept querystring (for GET proxy below and debugging)
    const sp = new URL(req.url).searchParams;

    const qRaw = (body.q ?? sp.get("q") ?? "").toString().trim();
    const page = Number(body.page ?? sp.get("page") ?? 1);
    const pageSize = Number(body.pageSize ?? sp.get("pageSize") ?? 12);

    // NOTE: keep plural keys to match ExploreClient
    const subjectsIn = cleanArr(body.subjects ?? getAll(sp, "subjects")).map(titleCase);
    const gradesIn   = cleanArr(body.grades   ?? getAll(sp, "grades")).map(normalizeGrade); // ✅ normalize
    const topicsIn   = cleanArr(body.topics   ?? getAll(sp, "topics")).map(titleCase);
    const subsIn     = cleanArr(body.sub_topics ?? getAll(sp, "sub_topics")).map(titleCase);

    const withAggregates = !!(body.withAggregates ?? (sp.get("withAggregates") === "1"));

    const qLower = qRaw.toLowerCase();
    const hasQ = qLower.length > 0;

    const limit = Math.min(50, Math.max(1, pageSize));
    const offset = (Math.max(1, page) - 1) * limit;

    // ---------- WHERE for raw SQL (case-insensitive facets + text search) ----------
    const W = [];
    const subjOr = ciEqOr("subject", subjectsIn);
    const gradOr = ciEqOr("grade", gradesIn);
    const topicOr = ciEqOr("topic", topicsIn);
    const subOr = ciEqOr("sub_topic", subsIn);
    if (subjOr) W.push(subjOr);
    if (gradOr) W.push(gradOr);
    if (topicOr) W.push(topicOr);
    if (subOr) W.push(subOr);

    if (hasQ) {
      const ilike = `%${qLower}%`;
      // ✅ Combine LIKE and trigram with OR inside a single group
      W.push(Prisma.sql`
        (
          (
            lower(subject)   LIKE ${ilike} OR
            lower(topic)     LIKE ${ilike} OR
            lower(sub_topic) LIKE ${ilike} OR
            lower(grade)     LIKE ${ilike} OR
            lower(name)      LIKE ${ilike}
          )
          OR
          (
            -- pg_trgm's similarity searches (safe if extension exists; otherwise this block simply won't help)
            lower(subject)   % ${qLower} OR
            lower(topic)     % ${qLower} OR
            lower(sub_topic) % ${qLower} OR
            lower(grade)     % ${qLower} OR
            lower(name)      % ${qLower}
          )
        )
      `);
    }

    const WHERE = W.length
      ? Prisma.sql`${Prisma.join(W, Prisma.raw(" AND "))}`
      : Prisma.sql`TRUE`;

    let itemsRaw, total;

    if (hasQ) {
      // Try fast trigram ranking; if pg_trgm/similarity is missing, we'll fall back.
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
            WHERE ${WHERE}
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

        const totalRow = await prisma.$queryRaw`
          SELECT COUNT(*)::int AS c FROM "Presentation" WHERE ${WHERE};
        `;
        total = Number(totalRow?.[0]?.c || 0);
      } catch {
        // fall through to Prisma fallback below
      }
    }

    if (!itemsRaw) {
      // ---------- Prisma fallback (no pg_trgm or empty q) ----------
      const andFilters = [];

      if (subjectsIn.length) {
        andFilters.push({
          OR: subjectsIn.map((s) => ({ subject: { equals: s, mode: "insensitive" } })),
        });
      }
      if (gradesIn.length) {
        // ✅ use normalized labels
        andFilters.push({
          OR: gradesIn.map((g) => ({ grade: { equals: g, mode: "insensitive" } })),
        });
      }
      if (topicsIn.length) {
        andFilters.push({
          OR: topicsIn.map((t) => ({ topic: { equals: t, mode: "insensitive" } })),
        });
      }
      if (subsIn.length) {
        andFilters.push({
          OR: subsIn.map((s) => ({ sub_topic: { equals: s, mode: "insensitive" } })),
        });
      }
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

      total = await prisma.presentation.count({ where: whereObj });
      itemsRaw = await prisma.presentation.findMany({
        where: whereObj,
        orderBy: hasQ
          ? [{ id: "asc" }] // keep simple if you don't have rating/reviews columns everywhere
          : [{ id: "asc" }],
        take: Number(limit),
        skip: offset,
        select: {
          id: true,
          slug: true,
          name: true,
          subject: true,
          grade: true,
          topic: true,
          sub_topic: true,
          thumbnail: true,
          thumbnail_alt_text: true,
        },
      });
    }

    const items = itemsRaw.map((i) => ({
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
          .map((g) => ({ name: normalizeGrade(g.grade), count: g._count._all })) // ✅ normalize here too
          .sort((a, b) => {
            // keep your preferred order if desired; otherwise alphabetical:
            return a.name.localeCompare(b.name);
          }),
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

// Handy GET tester: /api/presentations/search?q=english&subjects=English&topics=Grammar
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
  };
  return POST(
    new Request(req.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(proxyBody),
    })
  );
}
