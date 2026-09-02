import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getInProcessOAuthFetch } from "@/lib/auth/in-process-oauth";

function splitSetCookieHeader(setCookie: string): string[] {
  return setCookie.split(/,(?=\s*[^;,=]+=[^;,]*)/).map((value) => value.trim()).filter(Boolean);
}

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; otp?: string; oauthQuery?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const otp = body.otp?.trim() ?? "";
  const oauthQuery = body.oauthQuery?.trim() ?? "";
  const response = await (await getInProcessOAuthFetch())(
    `${process.env.OAUTH_ISSUER}/sign-in/email-otp`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, otp, ...(oauthQuery ? { oauth_query: oauthQuery } : {}) }),
    },
  );

  const result = response.headers.get("location")
    ?? (response.headers.get("content-type")?.includes("application/json")
      ? ((await response.json()) as { url?: string }).url ?? ""
      : "");
  if (!response.ok && !result) {
    return NextResponse.json({ error: "Invalid sign-in code" }, { status: 400 });
  }

  const output = NextResponse.json({ continuation: result || `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/` });
  const cookieStore = await cookies();
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = headers.getSetCookie?.() ?? splitSetCookieHeader(headers.get("set-cookie") ?? "");
  for (const setCookie of setCookies) {
    const [nameValue] = setCookie.split(";", 1);
    const separator = nameValue.indexOf("=");
    if (separator <= 0) continue;
    cookieStore.set(nameValue.slice(0, separator), nameValue.slice(separator + 1), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
  }
  return output;
}
