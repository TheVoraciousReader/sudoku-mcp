import type { Metadata } from "next";

export const SITE_NAME = "Givens";
export const SITE_TITLE = "Givens — Sudoku with ChatGPT";
export const SITE_DESCRIPTION =
  "You and ChatGPT share one Sudoku. It names the next technique; you decide whether to fill it. Hints, checks, and one safe step — never a dumped solution.";

export const brand = {
  paper: "#F4EEE4",
  card: "#FBF8F1",
  ink: "#3A3228",
  teal: "#1E4A3A",
  muted: "#7A6F62",
  line: "#C9BDA8",
} as const;

export function normalizeSiteUrl(raw: string | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withScheme.replace(/\/+$/, "");
}

function rawSiteUrl(): string | undefined {
  return (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  );
}

function isProductionEmit(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    (process.env.VERCEL_ENV === "production" || process.env.CI === "true")
  );
}

let warnedMissingSiteUrl = false;

export function getSiteUrl(): string | null {
  const url = normalizeSiteUrl(rawSiteUrl());
  if (url) return url;

  if (isProductionEmit()) {
    throw new Error(
      "SITE_URL is required in production. Set it to the canonical https origin with no trailing slash.",
    );
  }

  if (!warnedMissingSiteUrl) {
    warnedMissingSiteUrl = true;
    console.warn(
      "SITE_URL is unset. Canonical, Open Graph, and sitemap absolute URLs are skipped until it is set.",
    );
  }

  return null;
}

function withSiteName(title: string): string {
  if (
    title === SITE_NAME ||
    title.startsWith(`${SITE_NAME} —`) ||
    title.endsWith(` — ${SITE_NAME}`)
  ) {
    return title;
  }
  return `${title} — ${SITE_NAME}`;
}

export function createPageMetadata({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const pageTitle = withSiteName(title);
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;

  return {
    title: pageTitle,
    description,
    applicationName: SITE_NAME,
    keywords: ["Sudoku", "ChatGPT", "WebMCP", "collaborative puzzle"],
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    alternates: siteUrl ? { canonical: canonicalPath } : undefined,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: pageTitle,
      description,
      locale: "en_US",
      ...(siteUrl ? { url: canonicalPath } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
