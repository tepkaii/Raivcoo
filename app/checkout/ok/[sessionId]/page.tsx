// app/checkout/[sessionId]/page.tsx (complete rewrite)
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

interface CheckoutPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const supabase = await createClient();
  const { sessionId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/pricing");
  }

  // Get checkout session
  const { data: session, error } = await supabase
    .from("checkout_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (error || !session) {
    redirect("/pricing");
  }

  // Check if session is expired
  if (new Date() > new Date(session.expires_at)) {
    redirect("/pricing");
  }

  // Get current subscription if exists
  let currentSubscription = null;
  if (session.current_subscription_id) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", session.current_subscription_id)
      .eq("user_id", user.id)
      .single();
    currentSubscription = subscription;
  }

  // Create plan object for display using session data
  const selectedPlan = {
    id: session.plan_id,
    name: session.plan_name,
    price: session.amount.toString(),
    storage: `${session.storage_gb}GB storage`,
    features: session.features || [],
  };

  return (
    <CheckoutClient
      user={user}
      selectedPlan={selectedPlan}
      currentSubscription={currentSubscription}
      customStorage={session.storage_gb}
      action={session.action}
      billingPeriod={session.billing_period}
      sessionId={sessionId}
    />
  );
}
