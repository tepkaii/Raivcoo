import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

interface CheckoutPageProps {
  searchParams: Promise<{
    plan?: string;
    storage?: string;
    price?: string;
    billing?: string;
    action?: string;
    currentSub?: string;
  }>;
}

const pricingTiers = [
  {
    id: "free",
    name: "Free",
    price: "0",
    storage: "500MB storage included",
    features: [
      "Upload videos, images & files",
      "2 active review projects",
      "Basic timestamped comments",
      "Secure file hosting",
      "Email notifications",
      "30-day link expiration",
      "200MB max upload size",
    ],
  },
  {
    id: "lite",
    name: "Lite",
    price: "2.99", // Base price
    storage: "50GB storage included", // Base storage
    features: [
      "Everything in Free plan",
      "Unlimited review projects",
      "Advanced timestamped comments",
      "Password protection for links",
      "Custom expiration dates",
      "Real-time notifications",
      "2GB max upload size",
      "Basic analytics",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "5.99", // Base price
    storage: "250GB storage included", // Base storage
    features: [
      "Everything in Lite plan",
      "Advanced analytics & insights",
      "Priority support",
      "Custom branding options",
      "Advanced security features",
      "API access",
      "Dedicated support",
      "5GB max upload size",
      "Team collaboration features",
    ],
  },
];

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?redirect=/checkout" + (params.plan ? `&plan=${params.plan}` : "")
    );
  }

  let selectedPlan = pricingTiers.find((tier) => tier.id === params.plan);

  if (!selectedPlan) {
    redirect("/pricing");
  }

  // Handle custom storage and pricing for Lite and Pro plans
  if (
    (params.plan === "lite" || params.plan === "pro") &&
    params.storage &&
    params.price
  ) {
    selectedPlan = {
      ...selectedPlan,
      price: params.price,
      storage: `${params.storage}GB storage included`,
    };
  }

  // Check current subscription
  let currentSubscription = null;
  if (params.currentSub) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", params.currentSub)
      .eq("user_id", user.id)
      .single();
    currentSubscription = subscription;
  }

  return (
    <CheckoutClient
      user={user}
      selectedPlan={selectedPlan}
      currentSubscription={currentSubscription}
      customStorage={params.storage ? parseFloat(params.storage) : undefined}
      action={params.action}
      billingPeriod={params.billing || "monthly"} // Pass billing period from URL params
    />
  );
}