// app/portal/mis-licencias/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";

type License = {
  id: string;
  licenseKey?: string;
  producto?: string;
  usuario?: string;
  estado?: string;
  status?: string;
  planName?: string | null;
  fechaCreacion?: string;
  fechaExpiracion?: string | null;
};

function estadoBadge(lic: License): { label: string; cls: string } {
  const raw = (lic.estado || lic.status || "").toLowerCase();
  if (raw === "activa" || raw === "active") {
    return { label: "Activa", cls: "bg-emerald-100 text-emerald-700" };
  }
  if (raw === "expirada" || raw === "expired") {
    return { label: "Expirada", cls: "bg-red-100 text-red-700" };
  }
  if (raw === "suspendida" || raw === "suspended") {
    return { label: "Suspendida", cls: "bg-amber-100 text-amber-700" };
  }
  return { label: lic.estado || lic.status || "Sin estado", cls: "bg-gray-100 text-gray-600" };
}

function fmtFecha(iso?: string | null): string {
  if (!iso) return "Sin vencimiento";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-MX");
}

export default function MisLicenciasPage() {
  const [licencias, setLicencias] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/portal/licenses");
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!res.ok) {
        setError("No se pudieron cargar tus licencias");
        return;
      }
      setNeedsLogin(false);
      setError("");
      const data = await res.json();
      setLicencias(data.licenses ?? []);
    } catch {
      setError("No se pudo contactar el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Mis licencias</h1>
      <p className="mt-1 text-sm text-gray-500">
        Estas son las licencias registradas con tu correo.
      </p>

      {needsLogin && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="font-semibold text-gray-900">Inicia sesión para ver tus licencias</p>
          <a
            href="/login"
            className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Ir a iniciar sesión
          </a>
        </div>
      )}

      {error && !needsLogin && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !needsLogin && !error && (
        <p className="mt-6 text-sm text-gray-500">Cargando tus licencias...</p>
      )}

      {!loading && !needsLogin && !error && licencias.length === 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-gray-700">Aún no tienes licencias registradas.</p>
          <p className="mt-1 text-sm text-gray-500">
            Cuando compres un producto de CoreAura, tu licencia aparecerá aquí.
          </p>
        </div>
      )}

      {!loading && !needsLogin && !error && licencias.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {licencias.map((lic) => {
            const badge = estadoBadge(lic);
            return (
              <section
                key={lic.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-gray-900">
                    {lic.producto || "Producto CoreAura"}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <dl className="mt-3 space-y-1 text-sm text-gray-600">
                  {lic.planName && (
                    <div className="flex justify-between">
                      <dt>Plan</dt>
                      <dd>{lic.planName}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <dt>Clave</dt>
                    <dd className="break-all font-mono text-xs">
                      {lic.licenseKey || lic.id}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Creada</dt>
                    <dd>{fmtFecha(lic.fechaCreacion)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Vencimiento</dt>
                    <dd>{fmtFecha(lic.fechaExpiracion)}</dd>
                  </div>
                </dl>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
