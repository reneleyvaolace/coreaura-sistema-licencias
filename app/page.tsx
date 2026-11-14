// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <h1 className="text-4xl font-bold mb-4">CoreAura - Sistema de Licencias</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300">
        Bienvenido a tu panel de administración de licencias.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/portal/mis-licencias"
          className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white"
        >
          Mis licencias
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700"
        >
          Panel de administración
        </Link>
      </div>
    </main>
  );
}
