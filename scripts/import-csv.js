// scripts/import-csv.js
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import slugify from "../src/lib/slugify.js";

const prisma = new PrismaClient();

const titleCase = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function toFloatOrNull(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function toIntOrNull(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

function parseArgs(argv) {
  const args = { file: null, purge: false, distinctBy: "id", emitDistincts: false };
  for (const a of argv.slice(2)) {
    if (a.startsWith("--distinct-by=")) {
      args.distinctBy = a.split("=")[1] || "id";
    } else if (a === "--purge") {
      args.purge = true;
    } else if (a === "--emit-distincts") {
      args.emitDistincts = true;
    } else if (!a.startsWith("--") && !args.file) {
      args.file = a;
    }
  }
  if (!args.file) {
    throw new Error("Usage: node scripts/import-csv.js <path/to.csv> [--purge] [--distinct-by=...] [--emit-distincts]");
  }
  return args;
}

function normalizeRow(r) {
  const out = { ...r };
  for (const k of Object.keys(out)) {
    if (out[k] == null) continue;
    if (typeof out[k] === "string") out[k] = out[k].trim();
  }
  if ("subject" in out) out.subject = titleCase(out.subject);
  if ("grade" in out) out.grade = titleCase(out.grade);
  return out;
}

function distinctRows(rows, mode, headers) {
  if (!rows.length) return rows;

  let keys = [];
  if (mode === "all") keys = headers.slice();
  else if (mode === "id") keys = ["id"];
  else keys = mode.split(",").map((s) => s.trim()).filter(Boolean);

  const seen = new Set();
  const unique = [];
  for (const r of rows) {
    const key = JSON.stringify(keys.map((k) => r[k] ?? ""));
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(r);
  }
  return unique;
}

async function main() {
  const { file, purge, distinctBy, emitDistincts } = parseArgs(process.argv);

  const csvText = fs.readFileSync(file, "utf8");
  const rawRows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });

  if (!rawRows.length) {
    console.log("CSV contains 0 rows. Nothing to import.");
    return;
  }

  // Normalize + dedupe
  const normalized = rawRows.map(normalizeRow);
  const headers = Object.keys(normalized[0]);

  const before = normalized.length;
  const deduped = distinctRows(normalized, distinctBy, headers);

  // Filter out invalid/blank IDs
  const good = [];
  let skipped = 0;
  for (const r of deduped) {
    const idNum = Number(r.id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      skipped++;
      continue; // skip bad row
    }
    good.push(r);
  }

  // Enforce unique IDs (keep first)
  const ids = new Set();
  const finalRows = [];
  for (const r of good) {
    const idNum = Number(r.id);
    if (ids.has(idNum)) {
      skipped++;
      continue; // skip duplicate id
    }
    ids.add(idNum);
    finalRows.push(r);
  }

  console.log(`Rows in CSV: ${before}`);
  console.log(`After distinct(${distinctBy}): ${deduped.length}`);
  console.log(`Valid rows (unique ids): ${finalRows.length}`);
  console.log(`Skipped rows (invalid or duplicate ids): ${skipped}`);

  if (!finalRows.length) {
    console.error("No valid rows to import.");
    process.exit(1);
  }

  // Purge rows not present in CSV
  if (purge) {
    console.log("Purging rows not present in CSV (by id)...");
    await prisma.presentation.deleteMany({
      where: { id: { notIn: Array.from(ids) } },
    });
  }

  // Upsert valid rows
  let count = 0;
  for (const r of finalRows) {
    const id = Number(r.id);
    const name = String(r.name || "").trim();
    const subject = titleCase(r.subject);
    const grade = titleCase(r.grade);
    const topic = String(r.topic || "").trim() || null;
    const sub_topic = String(r.sub_topic || "").trim() || null;
    const slug = `${slugify(name || "presentation")}-${id}`;

    await prisma.presentation.upsert({
      where: { id },
      update: {
        slug,
        name,
        grade,
        subject,
        topic,
        sub_topic,
        thumbnail_alt_text: r.thumbnail_alt_text || null,
        thumbnail: r.thumbnail || null,
        presentation_content: r.presentation_content || null,
        presentation_view_link: r.presentation_view_link || "",
        rating: toFloatOrNull(r.rating),
        reviews: toIntOrNull(r.reviews),
        download_ppt_url: r.download_ppt_url || null,
        download_pdf_url: r.download_pdf_url || null,
        slides_export_link_url: r.slides_export_link_url || null,
        meta_description: r.meta_description || null,
        meta_titles: r.meta_titles || null,
        summary: r.summary || null,
      },
      create: {
        id,
        slug,
        name,
        grade,
        subject,
        topic,
        sub_topic,
        thumbnail_alt_text: r.thumbnail_alt_text || null,
        thumbnail: r.thumbnail || null,
        presentation_content: r.presentation_content || null,
        presentation_view_link: r.presentation_view_link || "",
        rating: toFloatOrNull(r.rating),
        reviews: toIntOrNull(r.reviews),
        download_ppt_url: r.download_ppt_url || null,
        download_pdf_url: r.download_pdf_url || null,
        slides_export_link_url: r.slides_export_link_url || null,
        meta_description: r.meta_description || null,
        meta_titles: r.meta_titles || null,
        summary: r.summary || null,
      },
    });

    count++;
    if (count % 1000 === 0) console.log(`Upserted ${count} rows...`);
  }

  console.log(`✅ Imported ${finalRows.length} rows (skipped ${skipped}).`);

  if (emitDistincts) {
    const outDir = path.join(process.cwd(), "public", "distincts");
    fs.mkdirSync(outDir, { recursive: true });
    for (const c of headers) {
      const set = new Set(finalRows.map((r) => r[c]).filter((v) => v !== "" && v != null));
      const arr = Array.from(set).sort();
      const p = path.join(outDir, `${c}.txt`);
      fs.writeFileSync(p, arr.join("\n"), "utf8");
    }
    console.log(`Wrote per-column distinct lists to ${path.join("public", "distincts")}/<column>.txt`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
