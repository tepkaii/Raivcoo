// lib/paypal-client.ts
import paypal from "@paypal/checkout-server-sdk";

function environment() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  console.log("Environment check:", {
    clientIdExists: !!clientId,
    clientSecretExists: !!clientSecret,
    clientIdLength: clientId?.length,
    environment: process.env.PAYPAL_ENVIRONMENT,
  });

  if (!clientId || !clientSecret) {
    throw new Error(
      `PayPal credentials missing: clientId=${!!clientId}, clientSecret=${!!clientSecret}`
    );
  }

  if (process.env.PAYPAL_ENVIRONMENT === "live") {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
}

export function paypalClient() {
  return new paypal.core.PayPalHttpClient(environment());
}
