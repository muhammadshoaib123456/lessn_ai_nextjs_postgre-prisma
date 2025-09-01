// scripts/import-csv.js
import fs from "fs";
import { parse } from "csv-parse/sync";
import slugify from "../src/lib/slugify.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const titleCase = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node scripts/import-csv.js public/trial1.csv");
    process.exit(1);
  }
  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parse(text, { columns: true, skip_empty_lines: true });

  for (const r of rows) {
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
        rating: r.rating ? Number(r.rating) : null,
        reviews: r.reviews ? Number(r.reviews) : null,
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
        rating: r.rating ? Number(r.rating) : null,
        reviews: r.reviews ? Number(r.reviews) : null,
        download_ppt_url: r.download_ppt_url || null,
        download_pdf_url: r.download_pdf_url || null,
        slides_export_link_url: r.slides_export_link_url || null,
        meta_description: r.meta_description || null,
        meta_titles: r.meta_titles || null,
        summary: r.summary || null,
      },
    });
  }

  console.log(`Imported ${rows.length} rows.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
