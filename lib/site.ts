/*
 * The site's absolute URL (4.8): metadataBase (Open Graph and canonical URLs), the sitemap and
 * robots.txt. NEXT_PUBLIC_SITE_URL wins (set it once the domain is final, 11.1); on Vercel,
 * VERCEL_PROJECT_PRODUCTION_URL (set by the platform, no scheme) covers deploys before that;
 * locally it's the dev server.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

/** An absolute URL for a site path ("/work" → "https://…/work"). */
export const absoluteUrl = (path: string) =>
  new URL(path, `${siteUrl}/`).toString();
