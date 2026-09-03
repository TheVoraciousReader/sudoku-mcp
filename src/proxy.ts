import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeSiteUrl } from "@/lib/seo";

export function proxy(request: NextRequest) {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return NextResponse.next();
  }

  const siteUrl = normalizeSiteUrl(process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL);
  if (!siteUrl) return NextResponse.next();

  const canonical = new URL(siteUrl);
  const host = request.nextUrl.hostname;
  if (host === canonical.hostname || host === "localhost" || host === "127.0.0.1") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = canonical.protocol;
  url.host = canonical.host;
  url.port = canonical.port;
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|twitter-image|sitemap.xml|robots.txt).*)",
  ],
};
