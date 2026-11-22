import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/site";

/** /robots.txt (4.8): everything is crawlable except /dev and the API. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dev", "/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
