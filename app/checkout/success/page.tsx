import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SuccessClient from "./SuccessClient";

interface SuccessPageProps {
  searchParams: Promise<{
    plan?: string;
    storage?: string;
    action?: string;
    billing?: string;
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

  // Create display version of the plan
  const customStorage = params.storage ? parseFloat(params.storage) : undefined;

  const planForDisplay = {
    id: selectedPlan.id,
    name: selectedPlan.name,
    price:
      selectedPlan.id === "free"
        ? "0"
        : selectedPlan.basePrice?.toString() || "0",
    storage: customStorage
      ? `${customStorage}GB storage`
      : selectedPlan.id === "free"
        ? "500MB storage"
        : `${selectedPlan.baseStorage}GB+ flexible storage`,
    features: selectedPlan.features,
    billing: params.billing,
  };

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
      selectedPlan={planForDisplay}
      subscription={subscription}
      action={params.action}
      billingPeriod={params.billing || "monthly"}
    />
  );
}