// app/checkout/cancel/page.tsx
import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-xl text-center max-w-lg">
        <svg
          className="w-20 h-20 text-red-500 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h1 className="text-3xl font-bold text-gray-800 mt-4">Pago Cancelado</h1>
        <p className="text-gray-600 mt-2 text-lg">
          El proceso de pago fue cancelado o falló.
        </p>
        <p className="text-gray-500 mt-4">
          No se ha realizado ningún cargo. Puedes intentar de nuevo desde la página
          de planes.
        </p>
        <Link
          href="/dashboard/plans" // O a tu página pública de planes
          className="inline-block mt-8 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition"
        >
          Ver Planes
        </Link>
      </div>
    </div>
  );
}