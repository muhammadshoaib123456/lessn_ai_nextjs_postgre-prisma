import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST() {
  try {
    revalidateTag("presentations");
    return NextResponse.json({ ok: true, revalidated: true });
  } catch (e) {
    console.error("revalidate presentations failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
