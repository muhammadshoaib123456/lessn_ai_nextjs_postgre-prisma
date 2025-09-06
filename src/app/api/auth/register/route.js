// src/app/api/auth/register/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";
import { welcomeEmail } from "@/lib/email-templates";

export async function POST(req) {
  try {
    const { firstName, email, password } = await req.json();
    const e = String(email || "").toLowerCase().trim();

    if (!firstName || !e || !password || password.length < 6) {
      return NextResponse.json({ ok: false, message: "Invalid input" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: e } });
    if (exists) {
      return NextResponse.json({ ok: false, message: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: firstName, email: e, passwordHash },
    });

    const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "";
    try {
      const { subject, html, text } = welcomeEmail(firstName, base);
      const info = await sendMail({ to: e, subject, html, text });
      // helpful server log
      console.log("[welcome email] sent", info);
    } catch (mailErr) {
      console.error("[welcome email] failed:", mailErr);
      // Do not fail signup just because email failed; still return ok=true.
    }

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e) {
    console.error("[register] error:", e);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
