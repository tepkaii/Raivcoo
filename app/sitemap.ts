import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: "https://www.raivcoo.com",

      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.raivcoo.com/dashboard",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://www.raivcoo.com/legal/PrivacyPolicy",

      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.raivcoo.com/legal/TermsOfService",

      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.raivcoo.com/media",

      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://www.raivcoo.com/pricing",

      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.raivcoo.com/login",

      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.raivcoo.com/signup",

      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://www.raivcoo.com/tools",

      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects",

      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects/extensions",

      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects/extensions/label-color-picker",

      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects/extensions/layer-flow",

      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects/extensions/re-align",

      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects/extensions/re-duplicate",

      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects/extensions/shape-manager",

      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}