// app/checkout/success/page.tsx
"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function CheckoutSuccessPage() {
  
  useEffect(() => {
    // Aquí podrías (opcionalmente) verificar la sesión 
    // o el ID de transacción de la URL para mostrar más detalles.
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-xl text-center max-w-lg">
        <svg
          className="w-20 h-20 text-green-500 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h1 className="text-3xl font-bold text-gray-800 mt-4">¡Pago Exitoso!</h1>
        <p className="text-gray-600 mt-2 text-lg">
          Tu licencia ha sido generada y activada.
        </p>
        <p className="text-gray-500 mt-4">
          Hemos enviado los detalles a tu correo electrónico. Revisa tu bandeja de
          entrada (y spam).
        </p>
        <Link
          href="/dashboard/licenses"
          className="inline-block mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          Ir a mis Licencias
        </Link>
      </div>
    </div>
  );
}