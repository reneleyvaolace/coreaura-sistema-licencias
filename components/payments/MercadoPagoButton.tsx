// components/payments/MercadoPagoButton.tsx
"use client";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { useState } from "react";

interface MercadoPagoButtonProps {
  planId: string;
  userEmail: string;
}

export default function MercadoPagoButton({
  planId,
  userEmail,
}: MercadoPagoButtonProps) {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "";

  if (!publicKey) {
    return (
      <div className="text-red-500">
        Error: MercadoPago Public Key no está configurada.
      </div>
    );
  }

  // Inicializa MercadoPago
  initMercadoPago(publicKey, { locale: "es-MX" });

  const createPreference = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, userEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la preferencia de pago");
      }

      // Guardamos el ID de la preferencia para el botón
      setPreferenceId(data.preferenceId);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Si no tenemos ID, mostramos un botón para crearlo */}
      {!preferenceId && (
        <button
          onClick={createPreference}
          disabled={loading}
          className="w-full bg-[#009EE3] text-white font-semibold py-3 rounded-lg hover:bg-[#0081c7] transition flex items-center justify-center disabled:opacity-50"
        >
          {loading ? "Generando..." : "Pagar con Mercado Pago"}
        </button>
      )}

      {error && (
        <div className="text-red-500 text-center mt-2 text-sm">{error}</div>
      )}

      {/* Cuando tenemos ID, MercadoPago renderiza el botón de pago */}
      {preferenceId && (
        <Wallet
          initialization={{ preferenceId: preferenceId }}
        />
      )}
    </div>
  );
}