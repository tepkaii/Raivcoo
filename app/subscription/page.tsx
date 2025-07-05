// app/subscription/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SubscriptionClient from "./SubscriptionClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription - Manage Your Plan",
  description:
    "Manage your subscription, view billing history, and update your plan.",
};

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

 if (!user) {
   const returnUrl = encodeURIComponent(`/subscription`);
   redirect(`/login?returnTo=${returnUrl}`);
 }

  // Get current subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get order history
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <SubscriptionClient
        user={user}
        subscription={subscription}
        orders={orders || []}
      />
    </div>
  );
}
