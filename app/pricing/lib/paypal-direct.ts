const PAYPAL_API_BASE =
  process.env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are missing");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal auth error:", error);
    throw new Error(
      `PayPal authentication failed: ${response.status} - ${error}`
    );
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(orderData: {
  amount: number;
  currency: string;
  description: string;
  referenceId: string;
}) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderData.referenceId,
          amount: {
            currency_code: orderData.currency,
            value: orderData.amount.toString(),
          },
          description: orderData.description,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal create order error:", error);
    throw new Error(
      `Failed to create PayPal order: ${response.status} - ${error}`
    );
  }

  return response.json();
}
