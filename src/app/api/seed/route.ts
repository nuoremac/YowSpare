import { NextResponse } from "next/server";

export async function GET() {
  // This route exists only to keep Next happy; seeding happens client-side in IndexedDB.
  return NextResponse.json({ ok: true });
}
