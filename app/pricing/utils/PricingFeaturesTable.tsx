// app/pricing/components/PricingFeaturesTable.tsx
"use client";

import { CheckBadgeIcon, XMarkIcon } from "@heroicons/react/24/solid";
import {
  featureCategories,
  getFeaturesByCategory,
  type PricingFeature,
} from "./features-data";
import React from "react";

interface PricingFeaturesTableProps {
  className?: string;
}

const planConfig = {
  free: {
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    buttonText: "Get Started",
    buttonVariant: "secondary" as const,
    order: 1,
  },
  pro: {
    name: "Pro",
    price: "$5.99",
    period: "/month",
    highlight: true,
    buttonText: "Get Started",
    buttonVariant: "default" as const,
    order: 2,
  },
  lite: {
    name: "Lite",
    price: "$2.99",
    period: "/month",
    highlight: false,
    buttonText: "Get Started",
    buttonVariant: "secondary" as const,
    order: 3,
  },
};

function FeatureValue({
  value,
  plan,
}: {
  value: boolean | string | number;
  plan: "free" | "lite" | "pro";
}) {
  if (typeof value === "boolean") {
    return (
      <div className="flex justify-center py-2">
        {value ? (
          <CheckBadgeIcon className="h-5 w-5 text-blue-600" />
        ) : (
          <XMarkIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <div className="text-center font-medium text-foreground py-2">{value}</div>
  );
}

export default function PricingFeaturesTable({
  className = "",
}: PricingFeaturesTableProps) {
  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
          Compare All Features
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about our plans. Start free and upgrade as
          you grow.
        </p>
      </div>

      {/* Features Table */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-6 py-6 text-left border-r border-border">
                <h3 className="font-semibold text-lg text-foreground">
                  Features
                </h3>
              </th>

              {/* Free Plan Header */}
              <th className="text-center px-4 py-6 w-1/4 border-r border-border">
                <div className="space-y-2">
                  <h4 className="font-bold text-xl text-foreground">
                    {planConfig.free.name}
                  </h4>
                  <div className="text-2xl font-bold text-foreground">
                    {planConfig.free.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      {planConfig.free.period}
                    </span>
                  </div>
                </div>
              </th>

              {/* Pro Plan Header - highlighted */}
              <th className="text-center px-4 py-6 bg-primary/10 w-1/4 border-r border-border">
                <div className="space-y-2">
                  <h4 className="font-bold text-xl text-foreground">
                    {planConfig.pro.name}
                  </h4>
                  <div className="text-2xl font-bold text-foreground">
                    {planConfig.pro.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      {planConfig.pro.period}
                    </span>
                  </div>
                </div>
              </th>

              {/* Lite Plan Header */}
              <th className="text-center px-4 py-6 w-1/4">
                <div className="space-y-2">
                  <h4 className="font-bold text-xl text-foreground">
                    {planConfig.lite.name}
                  </h4>
                  <div className="text-2xl font-bold text-foreground">
                    {planConfig.lite.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      {planConfig.lite.period}
                    </span>
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {Object.values(featureCategories).map((category) => {
              const features = getFeaturesByCategory(category);

              return (
                <React.Fragment key={category}>
                  {/* Category Header Row */}
                  <tr className="bg-muted/20 border-t border-border">
                    <td className="px-6 py-3 border-r border-border">
                      <h3 className="font-semibold text-base text-foreground">
                        {category}
                      </h3>
                    </td>
                    <td className="border-r border-border"></td>
                    <td className="bg-primary/10 border-r border-border"></td>
                    <td></td>
                  </tr>

                  {/* Feature Rows */}
                  {features.map((feature, index) => (
                    <tr
                      key={feature.id}
                      className={`hover:bg-muted/30 transition-colors duration-200 ${
                        index < features.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >
                      {/* Feature Name & Description */}
                      <td className="px-6 py-4 border-r border-border">
                        <div className="pr-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-foreground">
                              {feature.feature}
                            </span>
                          </div>
                          {feature.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {feature.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Free Plan Value */}
                      <td className="text-center px-4 py-4 border-r border-border">
                        <FeatureValue value={feature.free} plan="free" />
                      </td>

                      {/* Pro Plan Value - highlighted */}
                      <td className="text-center px-4 py-4 bg-primary/10 border-r border-border">
                        <FeatureValue value={feature.pro} plan="pro" />
                      </td>

                      {/* Lite Plan Value */}
                      <td className="text-center px-4 py-4">
                        <FeatureValue value={feature.lite} plan="lite" />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}