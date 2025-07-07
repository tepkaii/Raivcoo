import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SuccessClient from "./SuccessClient";

interface SuccessPageProps {
  searchParams: Promise<{
    plan?: string;
    storage?: string;
    action?: string;
    billing?: string; // Add billing parameter
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
    price: "2.99",
    storage: "50GB storage included",
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
    price: "5.99",
    storage: "250GB storage included",
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

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let selectedPlan = pricingTiers.find((tier) => tier.id === params.plan);

  if (!selectedPlan) {
    redirect("/dashboard");
  }

  // Handle custom storage for Lite and Pro plans
  if ((params.plan === "lite" || params.plan === "pro") && params.storage) {
    selectedPlan = {
      ...selectedPlan,
      storage: `${params.storage}GB storage included`,
      billing: params.billing,
    };
  }

  // Get current subscription with order details
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      `
      *,
      orders!subscriptions_order_id_fkey (
        id,
        amount,
        currency,
        completed_at,
        transaction_id
      )
    `
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  return (
    <SuccessClient
      user={user}
      selectedPlan={selectedPlan}
      subscription={subscription}
      action={params.action}
      billingPeriod={params.billing || "monthly"} // Pass billing period from URL
    />
  );
}