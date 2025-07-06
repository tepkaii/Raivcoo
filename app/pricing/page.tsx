import { createClient } from "@/utils/supabase/server";
import PricingClient from "./PricingClient";

export default async function PricingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get subscription - get the user's subscription regardless of status
  let currentSubscription = null;
  if (user) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*, storage_gb")
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
