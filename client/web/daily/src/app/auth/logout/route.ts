import { NextResponse } from "next/server";

import { clearSession, loadAuthConfig } from "@/lib/auth";

export async function POST() {
  const config = loadAuthConfig();
  await clearSession();
  return NextResponse.redirect(new URL("/login", config.appUrl));
}

export async function GET() {
  const config = loadAuthConfig();
  await clearSession();
  return NextResponse.redirect(new URL("/login", config.appUrl));
}
