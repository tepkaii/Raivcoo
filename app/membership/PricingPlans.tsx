// components/PricingPlans.tsx
"use client";

import { SetStateAction, useState } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const primaryColor = "#8B5CF6";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: [
      "Create and customize your portfolio",
      "Shareable portfolio link",
      "Upload video links (YouTube/Drive)",
      "Embed banners, titles, and pricing",
      "Basic view analytics",
      "Responsive layout",
    ],
    recommended: false,
  },
  {
    id: "monthly",
    name: "Pro Monthly",
    price: 10,
    features: [
      "1-on-1 voice calls (up to 60 min)",
      "Call recording + AI subtitles/summaries",
      "DM clients directly",
      "Access premium portfolio templates",
      "Advanced analytics dashboard",
      "Custom domain support",
    ],
    recommended: false,
  },
  {
    id: "quarterly",
    name: "Pro - 3 Months",
    price: 24,
    features: ["All Pro Monthly features", "Save 20% vs monthly"],
    recommended: true,
  },
  {
    id: "yearly",
    name: "Pro - Yearly",
    price: 72,
    features: ["All Pro Monthly features", "Save 40% vs monthly"],
    recommended: false,
  },
];

export default function PricingPlans({
  onPlanSelect,
}: {
  onPlanSelect: (plan: any) => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState(plans[1]);

  const handlePlanSelect = (plan: SetStateAction<(typeof plans)[number]>) => {
    setSelectedPlan(plan);
    onPlanSelect(plan);
  };

  return (
    <div className="grid gap-6 md:grid-cols-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative bg-card border rounded-2xl shadow-md transition-all p-6",
            selectedPlan.id === plan.id
              ? `border-[${primaryColor}] ring-2 ring-[${primaryColor}]/20`
              : `hover:border-[${primaryColor}]/60`
          )}
        >
          {plan.recommended && (
            <div className="absolute top-0 right-0 -translate-y-1/2 transform">
              <span
                className={`bg-[${primaryColor}] text-white text-xs font-bold px-3 py-1 rounded-full shadow`}
              >
                Most Popular
              </span>
            </div>
          )}

          <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>

          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold text-foreground">
              {plan.price === 0 ? "Free" : `$${plan.price}`}
            </span>
            {plan.price !== 0 && (
              <span className="text-sm text-muted-foreground ml-1">
                {plan.id === "monthly"
                  ? "/mo"
                  : plan.id === "quarterly"
                    ? "/3 mo"
                    : "/yr"}
              </span>
            )}
          </div>

          <ul className="mt-6 space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start">
                <CheckIcon
                  className={`h-5 w-5 text-[${primaryColor}] flex-shrink-0 mr-2`}
                />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handlePlanSelect(plan)}
            className={cn(
              "mt-6 w-full rounded-lg py-2 px-4 font-semibold transition-colors",
              selectedPlan.id === plan.id
                ? `bg-[${primaryColor}] text-white`
                : `bg-muted hover:bg-[${primaryColor}] hover:text-white`
            )}
          >
            {selectedPlan.id === plan.id ? "Selected" : "Select Plan"}
          </button>
        </div>
      ))}
    </div>
  );
}