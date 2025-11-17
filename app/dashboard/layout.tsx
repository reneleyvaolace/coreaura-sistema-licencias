// app/dashboard/layout.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-row">
      {/* Sidebar */}
      <nav className="w-64 bg-gray-900 text-white flex flex-col p-4">
        <h2 className="text-xl font-bold mb-8">CoreAura Admin</h2>
        <ul className="flex flex-col gap-4">
          <li><Link href="/dashboard">Inicio</Link></li>
          <li><Link href="/dashboard/licenses">Licencias</Link></li>
          <li><Link href="/dashboard/products">Productos</Link></li>
          <li><Link href="/dashboard/plans">Planes</Link></li>
          <li><Link href="/dashboard/transactions">Transacciones</Link></li>
          <li><Link href="/dashboard/users">Usuarios</Link></li>
          <li><Link href="/dashboard/settings">Configuración</Link></li>
          <li><Link href="/dashboard/test-validation">Probar API</Link></li>
          <li><Link href="/dashboard/help">Ayuda</Link></li>
        </ul>
        <div className="mt-auto pt-8">
          <span className="block text-gray-400 mb-3">{session?.user?.email}</span>
          <button
            className="py-2 px-4 bg-red-600 rounded text-white font-bold w-full"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
      {/* Main Content Area */}
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}
