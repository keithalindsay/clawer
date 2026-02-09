import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/", "/chat/", "/onboarding/"],
      },
    ],
    sitemap: "https://clawer.ai/sitemap.xml",
  };
}
