import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/complete-profile",
      },
    ],
    sitemap: "https://www.raivcoo.com/sitemap.xml", // Update with your site's URL
  };
}
