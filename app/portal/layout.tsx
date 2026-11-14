// app/portal/layout.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link href="/portal/mis-licencias" className="text-lg font-bold text-gray-900">
            CoreAura · Portal de cliente
          </Link>
          <div className="flex items-center gap-4">
            {session?.user?.email && (
              <span className="text-sm text-gray-500">{session.user.email}</span>
            )}
            <button
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
