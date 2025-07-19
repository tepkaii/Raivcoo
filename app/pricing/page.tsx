import { createClient } from "@/utils/supabase/server";
import PricingClient from "./PricingClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing ",
  description:
    "Explore Raivcoo pricing plans for solo editors. Flexible, fair pricing for video review and collaboration tools.",
  openGraph: {
    title: "Pricing ",
    description:
      "Explore Raivcoo pricing plans for solo editors. Flexible, fair pricing for video review and collaboration tools.",
    url: "https://www.raivcoo.com/pricing",
    siteName: "Raivcoo",
  },
  twitter: {
    title: "Pricing ",
    description:
      "Explore Raivcoo pricing plans for solo editors. Flexible, fair pricing for video review and collaboration tools.",
    card: "summary_large_image",
    creator: "@raivcoo",
  },
  alternates: {
    canonical: "https://www.raivcoo.com/pricing",
  },
};
export default async function PricingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get subscription - get the user's most recent subscription regardless of status
  let currentSubscription = null;
  if (user) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*, storage_gb, billing_period, max_upload_size_mb")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }) // Get most recent
      .limit(1)
      .single();

    currentSubscription = subscription;
  }

  return (
    <PricingClient user={user} currentSubscription={currentSubscription} />
  );
}