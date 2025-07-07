import { createClient } from "@/utils/supabase/server";
import PricingClient from "./PricingClient";

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