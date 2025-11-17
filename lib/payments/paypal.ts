// lib/payments/paypal.ts
import { PayPalHttpClient, core } from "@paypal/paypal-server-sdk";

function environment() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";

  // Usa sandbox para testing, live para producción
  return process.env.NODE_ENV === "production"
    ? new core.LiveEnvironment(clientId, clientSecret)
    : new core.SandboxEnvironment(clientId, clientSecret);
}

export function getPayPalClient() {
  return new PayPalHttpClient(environment());
}
