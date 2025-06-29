// utils/subscription.ts
import { createClient } from "@/utils/supabase/server";

export async function getUserSubscription(userId: string) {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!subscription) {
    return { hasSubscription: false, subscription: null };
  }

  const now = new Date();
  const expiryDate = new Date(subscription.expires_at);

  if (expiryDate <= now) {
    // Subscription expired, update status
    await supabase
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("id", subscription.id);

    return { hasSubscription: false, subscription: null };
  }

  return { hasSubscription: true, subscription };
}
