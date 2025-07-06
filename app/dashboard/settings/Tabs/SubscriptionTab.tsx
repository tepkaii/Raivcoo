"use client";

import SubscriptionClient from "./components/SubscriptionClient";

interface SubscriptionTabProps {
  user: any;
  subscription: any;
  orders: any[];
}

export default function SubscriptionTab({
  user,
  subscription,
  orders,
}: SubscriptionTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Subscription & Billing</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, view billing history, and update your plan.
        </p>
      </div>

      <div>
        <SubscriptionClient
          user={user}
          subscription={subscription}
          orders={orders}
        />
      </div>
    </div>
  );
}
