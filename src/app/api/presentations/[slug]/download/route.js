import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params }) {
  const session = await getServerSession({ req, ...authOptions });
  const { slug } = params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "pdf" | "ppt" | "slides"

  if (!session) {
    const login = new URL(`/login?next=/presentations/${slug}`, req.url);
    return NextResponse.redirect(login);
  }

  const p = await prisma.presentation.findUnique({ where: { slug } });
  if (!p) return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });

  let target = null;
  if (type === "pdf") target = p.download_pdf_url;
  if (type === "ppt") target = p.download_ppt_url;
  if (type === "slides") target = p.slides_export_link_url;

  if (!target) {
    return NextResponse.json({ ok: false, message: "File not available." }, { status: 404 });
  }
  return NextResponse.redirect(target);
}
