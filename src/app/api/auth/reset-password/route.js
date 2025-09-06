// src/app/api/auth/reset-password/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { token, password } = await req.json();
    if (!token || !password || password.length < 6) {
      return NextResponse.json({ ok: false, message: "Invalid input" }, { status: 400 });
    }

    const rec = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!rec || rec.expires < new Date()) {
      return NextResponse.json({ ok: false, message: "Token invalid or expired" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: rec.userId }, data: { passwordHash: hash } });

    // Burn the token
    await prisma.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reset-password] error:", e);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
