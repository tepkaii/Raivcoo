// app/pricing/page.tsx
import { createClient } from "@/utils/supabase/server";
import PricingClient from "./PricingClient";

export default async function PricingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentSubscription = null;
  if (user) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    currentSubscription = subscription;
  }

  return (
    <PricingClient user={user} currentSubscription={currentSubscription} />
  );
}
