// src/app/api/auth/forgot-password/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";
import { resetEmail } from "@/lib/email-templates";

export async function POST(req) {
  try {
    const { email } = await req.json();
    const e = String(email || "").toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: e } });

    // Always return OK, but only send if user exists.
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await prisma.passwordResetToken.create({
        data: { token, email: e, userId: user.id, expires },
      });

      const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "";
      const link = `${base}/reset-password/${token}`;

      try {
        const { subject, html, text } = resetEmail(link);
        const info = await sendMail({ to: e, subject, html, text });
        console.log("[reset email] sent", info);
      } catch (mailErr) {
        console.error("[reset email] failed:", mailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password] error:", err);
    return NextResponse.json({ ok: true }); // still OK to avoid user enumeration via errors
  }
}
