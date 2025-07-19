// app/api/checkout/create-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const {
      planId,
      customStorage,
      billingPeriod = "monthly",
      action,
      currentSubId,
    } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Updated pricing tiers to match PricingClient.tsx
    const pricingTiers = {
      free: {
        name: "Free",
        basePrice: 0,
        baseStorage: 0.5,
        additionalStoragePrice: 0,
        additionalStorageUnit: 1,
        maxStorage: 0.5,
        features: [
          "Upload videos,images",
          "200MB max upload size",
          "2 Active projects",
          "2 Members per project",
          "Pin & Draw Annotations",
          "Email/App notifications",
        ],
      },
      pro: {
        name: "Pro",
        basePrice: 5.99,
        baseStorage: 250,
        additionalStoragePrice: 1.5,
        additionalStorageUnit: 50,
        maxStorage: 2048,
        features: [
          "Everything in Free plan",
          "5GB max upload size",
          "Flexible storage up to 2TB",
          "Unlimited projects",
          "Unlimited members",
          "Password protection for links",
          "Custom expiration dates",
          "Download controls",
          "Priority support",
        ],
      },
      lite: {
        name: "Lite",
        basePrice: 2.99,
        baseStorage: 50,
        additionalStoragePrice: 1.0,
        additionalStorageUnit: 25,
        maxStorage: 150,
        features: [
          "Everything in Free plan",
          "2GB max upload size",
          "Flexible storage up to 150GB",
          "5 Active projects",
          "5 Members per project",
          "Password protection for links",
          "Custom expiration dates",
          "Download controls",
        ],
      },
    };

    const selectedPlan = pricingTiers[planId as keyof typeof pricingTiers];
    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Calculate pricing
    const totalStorage = customStorage || selectedPlan.baseStorage;
    const additionalStorage = Math.max(
      0,
      totalStorage - selectedPlan.baseStorage
    );
    const additionalStorageUnits =
      selectedPlan.additionalStorageUnit > 0
        ? additionalStorage / selectedPlan.additionalStorageUnit
        : 0;
    const additionalStorageCost =
      additionalStorageUnits * selectedPlan.additionalStoragePrice;

    // Apply yearly discount (30% off = 8.4 months)
    const yearlyMultiplier = billingPeriod === "yearly" ? 8.4 : 1;
    const totalPrice =
      (selectedPlan.basePrice + additionalStorageCost) * yearlyMultiplier;

    // Create checkout session in database
    const { data: session, error } = await supabase
      .from("checkout_sessions")
      .insert({
        user_id: user.id,
        plan_id: planId,
        plan_name: selectedPlan.name,
        storage_gb: totalStorage,
        amount: totalPrice,
        billing_period: billingPeriod,
        action: action || "new",
        current_subscription_id: currentSubId,
        expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        status: "pending",
        features: selectedPlan.features,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating checkout session:", error);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}