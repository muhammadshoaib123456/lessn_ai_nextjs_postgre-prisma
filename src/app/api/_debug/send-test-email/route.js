// src/app/api/_debug/send-test-email/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

export async function GET() {
  try {
    const to = process.env.SMTP_USER; // change to your inbox if you prefer
    const info = await sendMail({
      to,
      subject: "Lessn SMTP test",
      html: `<p>If you received this, Nodemailer + Brevo are working.</p>`,
      text: "SMTP test OK",
    });
    return NextResponse.json({ ok: true, info });
  } catch (e) {
    console.error("[smtp test] failed:", e);
    return NextResponse.json({ ok: false, message: String(e?.message || e) }, { status: 500 });
  }
}
