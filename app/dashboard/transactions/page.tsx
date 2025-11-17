// app/dashboard/transactions/page.tsx
"use client";

import { useState, useEffect } from "react";

// Definimos la interfaz para una transacción
interface Transaction {
  id: string;
  userEmail: string;
  planId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  provider: "paypal" | "mercadopago";
  licenseKey?: string;
  orderId?: string; // PayPal
  preferenceId?: string; // MercadoPago
  paymentId?: string;
  createdAt: string;
  completedAt?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/transactions");
        
        if (!response.ok) {
          throw new Error("Error al cargar el historial de transacciones.");
        }
        
        const data = await response.json();
        setTransactions(data.transactions);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const getStatusClass = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProviderClass = (provider: Transaction["provider"]) => {
    return provider === "paypal"
      ? "bg-blue-100 text-blue-800"
      : "bg-sky-100 text-sky-800";
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("es-MX");
  };

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Historial de Transacciones
      </h1>

      {loading && (
        <div className="text-center text-gray-800 py-12">
          Cargando transacciones...
        </div>
      )}
      
      {error && (
         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
           <strong className="font-bold">Error: </strong>
           <span className="block sm:inline">{error}</span>
         </div>
      )}

      {!loading && !error && (
        <div className="bg-white border border-gray-300 rounded shadow-sm overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Estado</th>
                <th className="py-3 px-4 text-left">Proveedor</th>
                <th className="py-3 px-4 text-left">Usuario (Email)</th>
                <th className="py-3 px-4 text-left">Monto</th>
                <th className="py-3 px-4 text-left">Clave de Licencia</th>
                <th className="py-3 px-4 text-left">ID Pago</th>
                <th className="py-3 px-4 text-left">Fecha Creación</th>
                <th className="py-3 px-4 text-left">Fecha Completo</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 px-4 text-center text-gray-500">
                    No se encontraron transacciones.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getStatusClass(
                          tx.status
                        )}`}
                      >
                        {tx.status === 'completed' ? 'Completado' : tx.status === 'pending' ? 'Pendiente' : 'Fallido'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                       <span
                        className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getProviderClass(
                          tx.provider
                        )}`}
                      >
                        {tx.provider}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{tx.userEmail}</td>
                    <td className="py-3 px-4 text-sm font-semibold">
                      ${tx.amount.toFixed(2)} {tx.currency}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">
                      {tx.licenseKey || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">
                      {tx.paymentId || tx.orderId || tx.preferenceId || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-sm">{formatDate(tx.createdAt)}</td>
                    <td className="py-3 px-4 text-sm">{formatDate(tx.completedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}