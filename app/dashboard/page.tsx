// app/dashboard/page.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalLicenses: number;
  activeLicenses: number;
  totalProducts: number;
  activeProducts: number;
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
}

interface RecentLicense {
  id: string;
  producto: string;
  usuario: string;
  fecha: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLicenses, setRecentLicenses] = useState<RecentLicense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "loading" && (!session || !session.user)) {
      router.push("/login");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/stats");
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
        setRecentLicenses(data.recentLicenses);
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || !session || !session.user) {
    return <div className="p-12 text-center text-gray-800">Cargando...</div>;
  }

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-lg text-gray-600 mt-2">
            Bienvenido, <span className="font-semibold text-blue-600">{session.user.email}</span>
          </p>
        </div>
        <button
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Cerrar sesión
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-600 py-12">Cargando estadísticas...</div>
      ) : (
        <>
          {/* Cards de Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card: Licencias */}
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Licencias Totales</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalLicenses || 0}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {stats?.activeLicenses || 0} activas
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card: Productos */}
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Productos</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalProducts || 0}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {stats?.activeProducts || 0} activos
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card: Usuarios */}
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Usuarios</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalUsers || 0}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {stats?.activeUsers || 0} activos
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card: Administradores */}
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Administradores</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.adminUsers || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Con acceso total</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Accesos Rápidos */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Accesos Rápidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboard/licenses" className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                <span className="text-blue-600 font-semibold">📋 Gestionar Licencias</span>
              </Link>
              <Link href="/dashboard/products" className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition">
                <span className="text-green-600 font-semibold">📦 Gestionar Productos</span>
              </Link>
              <Link href="/dashboard/users" className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition">
                <span className="text-purple-600 font-semibold">👥 Gestionar Usuarios</span>
              </Link>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Licencias Recientes</h2>
            {recentLicenses.length === 0 ? (
              <p className="text-gray-600">No hay licencias registradas aún.</p>
            ) : (
              <div className="space-y-3">
                {recentLicenses.map((license, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold text-gray-800">{license.producto}</p>
                      <p className="text-sm text-gray-600">{license.usuario}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-mono">{license.id}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(license.fecha).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
