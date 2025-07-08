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
    id: "free" as const,
    name: "Free",
    price: "0",
    baseStorage: 0.5, // 500MB
    maxUploadSize: 200, // 200MB
    level: 0,
    features: [
      "Upload videos, images",
      "200MB max upload size",
      "2 Active projects",
      "2 Members per project",
      "Timestamped comments",
      "Accurate Pin/Draw Annotation",
      "Email/App notifications",
    ],
  },
  {
    id: "lite" as const,
    name: "Lite",
    basePrice: 2.99,
    baseStorage: 50, // 50GB base
    additionalStoragePrice: 1.0, // $1.0 per 25GB
    additionalStorageUnit: 25, // 25GB increments
    maxStorage: 150, // 150GB max
    maxUploadSize: 2048, // 2GB
    level: 1,
    features: [
      "Everything in Free plan",
      "2GB max upload size",
      "flexible storage up to 150GB",
      "Unlimited projects",
      "Unlimited members",
      "Password protection for links",
      "Custom expiration dates",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    basePrice: 5.99,
    baseStorage: 250, // 250GB base
    additionalStoragePrice: 1.5, // $1.5 per 50GB
    additionalStorageUnit: 50, // 50GB increments
    maxStorage: 2048, // 2TB max
    maxUploadSize: 5120, // 5GB
    level: 2,
    popular: true,
    features: [
      "Everything in Free plan",
      "5GB max upload size",
      "flexible storage up to 2TB",
      "Unlimited projects",
      "Unlimited members",
      "Password protection for links",
      "Custom expiration dates",
      "Priority support",
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
  const customStorage = params.storage ? parseFloat(params.storage) : undefined;
  const customPrice = params.price ? params.price : undefined;

  // Create a display version of the plan with custom storage info
  const planForDisplay = {
    id: selectedPlan.id,
    name: selectedPlan.name,
    price:
      customPrice ||
      (selectedPlan.id === "free"
        ? "0"
        : selectedPlan.basePrice?.toString() || "0"),
    storage: customStorage
      ? `${customStorage}GB storage`
      : selectedPlan.id === "free"
        ? "500MB storage"
        : `${selectedPlan.baseStorage}GB+ flexible storage`,
    features: selectedPlan.features,
    billing: params.billing,
  };

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
      selectedPlan={planForDisplay}
      currentSubscription={currentSubscription}
      customStorage={customStorage}
      action={params.action}
      billingPeriod={params.billing || "monthly"}
    />
  );
}