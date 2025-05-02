import { MetadataRoute } from "next";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: "https://www.raivcoo.com",
    },
    {
      url: "https://www.raivcoo.com/PrivacyPolicy",
    },
    {
      url: "https://www.raivcoo.com/TermsOfService",
    },
    {
      url: "https://www.raivcoo.com/dashboard",
    },
    {
      url: "https://www.raivcoo.com/dashboard/clients",
    },
    {
      url: "https://www.raivcoo.com/dashboard/projects",
    },
    {
      url: "https://www.raivcoo.com/dashboard/account",
    },
    //
    {
      url: "https://www.raivcoo.com/dashboard/extensions",
    },
    {
      url: "https://www.raivcoo.com/dashboard/pending",
    },
    {
      url: "https://www.raivcoo.com/dashboard/reviews",
    },

    {
      url: "https://www.raivcoo.com/pricing",
    },
    {
      url: "https://www.raivcoo.com/login",
    },
    {
      url: "https://www.raivcoo.com/signup",
    },
    {
      url: "https://www.raivcoo.com/tools",
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects",
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects/extensions",
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects/extensions/label-color-picker",
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects/extensions/layer-flow",
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects/extensions/re-align",
    },
    {
      url: "https://www.raivcoo.com/tools/after-effects/extensions/shape-manager",
    },
  ];
}
