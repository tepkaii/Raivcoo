// app/membership/membership-client.tsx
// @ts-nocheck
"use client";

import { useState } from "react";
import PricingPlans from "./PricingPlans";
import PaymentProcessor from "./payment-processor";
import { CheckCircle2 } from "lucide-react";

export default function MembershipClient() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPaid, setIsPaid] = useState(false);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    // Reset payment state when plan changes
    setIsPaid(false);
  };

  const handlePaymentSuccess = () => {
    setIsPaid(true);
  };

  return (
    <div>
      {!isPaid ? (
        <div className="space-y-10">
          <PricingPlans onPlanSelect={handlePlanSelect} />

          {selectedPlan && (
            <div className="max-w-md mx-auto mt-8">
              <div className="bg-card border rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">Order Summary</h3>
                <div className="flex justify-between mb-2">
                  <span>{selectedPlan.name}</span>
                  <span>${selectedPlan.price}/mo</span>
                </div>
                <div className="border-t my-4"></div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${selectedPlan.price}/mo</span>
                </div>
              </div>

              <PaymentProcessor
                planId={selectedPlan.id}
                planName={selectedPlan.name}
                amount={selectedPlan.price}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center bg-green-50 rounded-xl p-12 max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Payment Successful!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for upgrading to {selectedPlan.name}! Your account has
            been updated with all the new features and benefits.
          </p>
          <a
            href="/dashboard"
            className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
          >
            Go to Dashboard
          </a>
        </div>
      )}
    </div>
  );
}
