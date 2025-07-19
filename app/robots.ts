import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/complete-profile",
          "/forgot-password",
          "/reset-password",
          "/set-password",
          "/invite",
        ],
      },
    ],
    sitemap: "https://www.raivcoo.com/sitemap.xml",
  };
}