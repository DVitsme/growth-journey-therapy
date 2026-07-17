import type { MetadataRoute } from "next";

// TEMPORARY: block all crawling while the site runs on the workers.dev preview URL.
// The real robots rules (+ sitemap) land with the SEO pass at DNS cutover — do NOT
// ship this blanket disallow on growthjourneytherapy.com.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
