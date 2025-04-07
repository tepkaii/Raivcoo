import { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Fetch all editor profiles that are published
  const { data: editors, error } = await supabase
    .from("editor_profiles")
    .select("*")
    .eq("account_status", "active")
    .eq("is_published", true);

  if (error || !editors) {
    console.error("Error fetching profiles for sitemap:", error);
    return [];
  }

  // Map the profiles to URLs for the sitemap
  const profileSitemap: MetadataRoute.Sitemap = editors.map(
    (editor: { display_name: string }) => ({
      url: `https://www.raivcoo.com/editors/${encodeURIComponent(
        editor.display_name
      )}`,
      lastmod: new Date().toISOString(), // Modify this if you track the last update
    })
  );
  // const SubdomainSitemap: MetadataRoute.Sitemap = editors.map(
  //   (editor: { display_name: string }) => ({
  //     url: `https://www.${encodeURIComponent(editor.display_name)}.raivcoo.com`,
  //     lastmod: new Date().toISOString(), // Modify this if you track the last update
  //   })
  // );
  // Add static URLs for pages
  return [
    {
      url: "https://www.raivcoo.com",
    },
    {
      url: "https://www.raivcoo.com/editors",
    },
    {
      url: "https://www.raivcoo.com/PrivacyPolicy",
    },
    {
      url: "https://www.raivcoo.com/TermsOfService",
    },
    {
      url: "https://www.raivcoo.com/profile",
    },
    {
      url: "https://www.raivcoo.com/portfolio",
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
    // Dynamic URLs for editor profiles
    ...profileSitemap,
  ];
}
