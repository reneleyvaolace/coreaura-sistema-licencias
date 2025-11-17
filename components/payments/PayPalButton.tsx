// components/payments/PayPalButton.tsx
"use client";
import {
  PayPalScriptProvider,
  PayPalButtons,
} from "@paypal/react-paypal-js";
import type { OnApproveData, OnApproveActions } from "@paypal/paypal-js";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface PayPalButtonProps {
  planId: string;
  userEmail: string;
}

export default function PayPalButton({ planId, userEmail }: PayPalButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  if (!paypalClientId) {
    return (
      <div className="text-red-500">
        Error: PayPal Client ID no está configurado.
      </div>
    );
  }

  // 1. Llama a tu API para crear una orden en PayPal
  const createOrder = async () => {
    setProcessing(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, userEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la orden de PayPal");
      }

      return data.orderId;
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
      return "";
    }
  };

  // 2. Llama a tu API para capturar el pago cuando el usuario aprueba
  const onApprove = async (data: OnApproveData, actions: OnApproveActions) => {
    setProcessing(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderID }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al capturar el pago");
      }
      
      // 3. Pago exitoso, redirigir
      router.push("/checkout/success");
      
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  const onError = (err: any) => {
    setError("Ocurrió un error con PayPal. Intenta de nuevo.");
    setProcessing(false);
  };

  const onCancel = () => {
    setProcessing(false);
  };

  return (
    <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD" }}>
      {processing && (
        <div className="text-center p-4">
          <p className="text-blue-600 font-semibold">Procesando pago...</p>
        </div>
      )}

      <div className={processing ? "hidden" : "block"}>
        <PayPalButtons
          style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onError}
          onCancel={onCancel}
        />
      </div>

      {error && (
        <div className="text-red-500 text-center mt-2 text-sm">{error}</div>
      )}
    </PayPalScriptProvider>
  );
}