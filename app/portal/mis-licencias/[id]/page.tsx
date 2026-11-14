// app/portal/mis-licencias/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Activation = {
  domain: string;
  activatedAt?: string;
  lastCheck?: string;
};

type License = {
  id: string;
  licenseKey?: string;
  producto?: string;
  usuario?: string;
  estado?: string;
  status?: string;
  planId?: string | null;
  planName?: string | null;
  duration?: string | null;
  fechaCreacion?: string;
  fechaExpiracion?: string | null;
  activations?: Activation[];
  maxActivations?: number;
};

type Plan = {
  id: string;
  name?: string;
  price?: number;
  duration?: string;
  features?: string[];
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

function duracionLabel(duration?: string | null): string {
  if (duration === "yearly") return "Anual";
  if (duration === "lifetime") return "De por vida";
  return "Mensual";
}

export default function DetalleLicenciaPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [licencia, setLicencia] = useState<License | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [noEncontrada, setNoEncontrada] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/portal/licenses/${id}`);
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (res.status === 404) {
        setNoEncontrada(true);
        return;
      }
      if (!res.ok) {
        setError("No se pudo cargar la licencia");
        return;
      }
      const data = await res.json();
      setLicencia(data.license ?? null);
      setPlan(data.plan ?? null);
    } catch {
      setError("No se pudo contactar el servidor");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <a
        href="/portal/mis-licencias"
        className="text-sm font-semibold text-gray-600 hover:text-gray-900"
      >
        ← Mis licencias
      </a>

      {loading && (
        <p className="mt-6 text-sm text-gray-500">Cargando tu licencia...</p>
      )}

      {needsLogin && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="font-semibold text-gray-900">Inicia sesión para ver tu licencia</p>
          <a
            href="/login"
            className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Ir a iniciar sesión
          </a>
        </div>
      )}

      {(noEncontrada || error) && !needsLogin && !loading && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="font-semibold text-gray-900">
            {noEncontrada
              ? "Esta licencia no existe o no te pertenece"
              : "No se pudo cargar la licencia"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {error || "Revisa tus licencias contratadas desde la lista."}
          </p>
        </div>
      )}

      {!loading && !needsLogin && !noEncontrada && !error && licencia && (
        <div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {licencia.producto || "Producto CoreAura"}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                estadoBadge(licencia).cls
              }`}
            >
              {estadoBadge(licencia).label}
            </span>
          </div>

          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Tu licencia</h2>
            <dl className="mt-3 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between gap-2">
                <dt>Clave</dt>
                <dd className="break-all font-mono text-xs">
                  {licencia.licenseKey || licencia.id}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Contratada</dt>
                <dd>{fmtFecha(licencia.fechaCreacion)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Vencimiento</dt>
                <dd>{fmtFecha(licencia.fechaExpiracion)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Duración</dt>
                <dd>{duracionLabel(licencia.duration)}</dd>
              </div>
            </dl>
          </section>

          <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Plan contratado</h2>
            {plan || licencia.planName ? (
              <dl className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <dt>Plan</dt>
                  <dd className="font-semibold text-gray-900">
                    {plan?.name || licencia.planName}
                  </dd>
                </div>
                {typeof plan?.price === "number" && (
                  <div className="flex justify-between">
                    <dt>Precio</dt>
                    <dd>${plan.price.toFixed(2)} USD</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Duración</dt>
                  <dd>{duracionLabel(plan?.duration || licencia.duration)}</dd>
                </div>
                {plan?.features && plan.features.length > 0 && (
                  <div className="pt-2">
                    <dt className="font-semibold text-gray-700">Incluye</dt>
                    <ul className="mt-1 space-y-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start text-sm text-gray-600">
                          <span className="mr-2 text-green-600">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                Esta licencia no tiene un plan asociado.
              </p>
            )}
          </section>

          <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Dominios activados</h2>
            <p className="mt-1 text-sm text-gray-500">
              Puedes activar esta licencia en{" "}
              {licencia.maxActivations || 1}{" "}
              {(licencia.maxActivations || 1) === 1 ? "sitio" : "sitios"}.
            </p>
            {licencia.activations && licencia.activations.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {licencia.activations.map((act, i) => (
                  <li
                    key={i}
                    className="flex justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  >
                    <span className="font-mono text-xs">{act.domain}</span>
                    <span className="text-xs text-gray-500">
                      {act.activatedAt ? fmtFecha(act.activatedAt) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                Aún no has activado esta licencia en ningún dominio.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
