"use client";

import { SetStateAction, useState } from "react";
import { CheckIcon, Laptop, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const primaryColor = "#8B5CF6";

const plans = [
  {
    id: "monthly",
    name: "Rivew Monthly",
    price: 3.99,
    features: [
      "Unlimited projects & tracks",
      "Timestamped client feedback",
      "AI-generated summaries",
      "Client review portals",
      "Extensions for 🟣AE, 🔵PR, 🟦PS, 🟨AI, 🔴AN",
      "Desktop apps for Windows 🪟 & macOS 🍎",
    ],
    recommended: false,
  },
  {
    id: "quarterly",
    name: "Rivew Monthly",
    price: 5.99,
    features: ["All Monthly features", "Save 20% – Best Value"],
    recommended: true,
  },
  {
    id: "yearly",
    name: "Rivew Monthly",
    price: 9.99,
    features: ["All Monthly features", "Save 40% – Long-Term Deal"],
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
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative bg-card border rounded-2xl shadow-md transition-all p-6 flex flex-col justify-between h-full",
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
                Best Value
              </span>
            </div>
          )}

          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {plan.name}
            </h3>

            <div className="mt-4 flex items-baseline">
              <span className="text-3xl font-bold text-foreground">
                ${plan.price.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground ml-1">
                {plan.id === "monthly"
                  ? "/mo"
                  : plan.id === "quarterly"
                    ? "/3 mo"
                    : "/yr"}
              </span>
            </div>

            <ul className="mt-6 space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <CheckIcon
                    className={`h-5 w-5 text-[${primaryColor}] flex-shrink-0 mr-2`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

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
