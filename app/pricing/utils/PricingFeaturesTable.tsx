// app/pricing/components/PricingFeaturesTable.tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckBadgeIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import {
  pricingFeatures,
  featureCategories,
  getFeaturesByCategory,
  formatFeatureValue,
  type PricingFeature,
} from "./features-data";

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
      <div className="flex justify-center">
        {value ? (
          <CheckBadgeIcon className="h-5 w-5 text-blue-600" />
        ) : (
          <XMarkIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    );
  }

  return <div className="text-center font-medium text-foreground">{value}</div>;
}

function CategorySection({
  category,
  features,
  isExpanded,
  onToggle,
}: {
  category: string;
  features: PricingFeature[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // Sort plans by order: Free, Pro, Lite
  const sortedPlans = ["free", "pro", "lite"] as const;

  return (
    <div className="border-b border-border">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left bg-muted/30 hover:bg-muted/70 transition-colors duration-200 flex items-center justify-between group"
      >
        <h3 className="font-semibold text-lg text-foreground">{category}</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {features.length} features
          </Badge>
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </div>
      </button>

      {/* Features List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`grid grid-cols-4 items-center py-4 px-6 border-b border-border/50 hover:bg-muted/30 transition-colors duration-200 ${
                  feature.highlight ? "bg-primary/5 border-primary/20" : ""
                }`}
              >
                {/* Feature Name & Description */}
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

                {/* Plan Values - ordered as Free, Pro, Lite */}
                <div className="text-center py-2">
                  <FeatureValue value={feature.free} plan="free" />
                </div>
                <div className="text-center py-2">
                  <FeatureValue value={feature.pro} plan="pro" />
                </div>
                <div className="text-center py-2">
                  <FeatureValue value={feature.lite} plan="lite" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingFeaturesTable({
  className = "",
}: PricingFeaturesTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.values(featureCategories)) // Start with all categories expanded
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4  text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
          Compare All Features
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about our plans. Start free and upgrade as
          you grow.
        </p>
      </div>

      {/* Features Table */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-4 items-center bg-muted/50 border-b border-border">
          <div className="px-6 py-6">
            <h3 className="font-semibold text-lg text-foreground">Features</h3>
          </div>

          {/* Plan Headers - ordered as Free, Pro, Lite */}
          <div className="text-center px-4 py-6 w-full">
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
          </div>

          {/* Pro Plan - highlighted in middle */}
          <div className="text-center px-4 py-6 bg-primary/5 border-x border-primary/20 w-full">
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
          </div>

          {/* Lite Plan */}
          <div className="text-center px-4 py-6 w-full">
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
          </div>
        </div>

        {/* Feature Categories */}
        {Object.values(featureCategories).map((category) => {
          const features = getFeaturesByCategory(category);
          const isExpanded = expandedCategories.has(category);

          return (
            <CategorySection
              key={category}
              category={category}
              features={features}
              isExpanded={isExpanded}
              onToggle={() => toggleCategory(category)}
            />
          );
        })}
      </div>
    </div>
  );
}
