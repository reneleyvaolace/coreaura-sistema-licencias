// app/admin/monitoreo/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";

type Pm2Proc = {
  name: string;
  status: string;
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
  pid: number;
};

type HealthCheck = {
  name: string;
  url: string;
  ok: boolean;
  status: number;
  ms: number;
};

type MonitorData = {
  checkedAt: string;
  server: {
    hostname: string;
    uptimeSec: number;
    load: number[];
    memTotal: number;
    memFree: number;
    disk: { total: number; free: number } | null;
  };
  pm2: Pm2Proc[];
  health: HealthCheck[];
};

function fmtBytes(n: number): string {
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(0)} MB`;
  return `${(n / 1024).toFixed(0)} KB`;
}

function fmtUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtProcUptime(ts: number): string {
  if (!ts) return "—";
  return fmtUptime(Math.floor((Date.now() - ts) / 1000));
}

function pct(used: number, total: number): number {
  if (!total) return 0;
  return Math.round((used / total) * 100);
}

export default function MonitoreoPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/monitor");
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!res.ok) {
        setError(`El servidor respondió ${res.status}`);
        return;
      }
      setNeedsLogin(false);
      setError("");
      setData(await res.json());
    } catch {
      setError("No se pudo contactar el servidor");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const pm2ByName = (name: string) =>
    data?.pm2.find((p) => p.name === name);

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-6 text-neutral-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Monitoreo</h1>
            <p className="text-sm text-neutral-400">
              Centro administrativo · servidor 163.192.137.253
            </p>
          </div>
          <button
            onClick={load}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Actualizar ahora
          </button>
        </div>

        {needsLogin && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="font-semibold">Inicia sesión para ver el monitoreo</p>
            <p className="mt-1 text-sm text-neutral-400">
              Esta página solo la ve quien tenga sesión en licencias.
            </p>
            <a
              href="/api/auth/signin"
              className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Ir a iniciar sesión
            </a>
          </div>
        )}

        {error && !needsLogin && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {data && (
          <>
            <p className="mb-4 text-xs text-neutral-500">
              Última revisión: {new Date(data.checkedAt).toLocaleString("es-MX")}
              {" · "}se actualiza cada 30 segundos
            </p>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              {data.health.map((h) => {
                const proc =
                  h.name === "Licencias"
                    ? pm2ByName("licencias")
                    : h.name === "Staging"
                      ? pm2ByName("coreaura-staging")
                      : undefined;
                return (
                  <section
                    key={h.name}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-3 w-3 rounded-full ${h.ok ? "bg-emerald-400" : "bg-red-500"}`}
                      />
                      <h2 className="font-semibold">{h.name}</h2>
                    </div>
                    <p className="mt-2 text-sm text-neutral-300">
                      {h.ok ? "En línea" : "Sin respuesta"}
                      {h.status > 0 && ` · HTTP ${h.status}`}
                      {` · ${h.ms} ms`}
                    </p>
                    <p className="mt-1 break-all text-xs text-neutral-500">{h.url}</p>
                    {proc && (
                      <dl className="mt-3 space-y-1 text-sm text-neutral-300">
                        <div className="flex justify-between">
                          <dt>Proceso PM2</dt>
                          <dd>{proc.status}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Tiempo activo</dt>
                          <dd>{fmtProcUptime(proc.uptime)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Reinicios</dt>
                          <dd>{proc.restarts}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Memoria</dt>
                          <dd>{fmtBytes(proc.memory)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>CPU</dt>
                          <dd>{proc.cpu.toFixed(1)}%</dd>
                        </div>
                      </dl>
                    )}
                    {h.name === "CoreAura OS" && (
                      <p className="mt-3 text-xs text-neutral-500">
                        Servidor tenant · 160.34.219.62
                      </p>
                    )}
                  </section>
                );
              })}
            </div>

            <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <h2 className="font-semibold">Servidor administrativo</h2>
              <p className="text-xs text-neutral-500">{data.server.hostname}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-neutral-400">Tiempo activo</p>
                  <p className="text-lg font-semibold">
                    {fmtUptime(data.server.uptimeSec)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Carga (1 min)</p>
                  <p className="text-lg font-semibold">
                    {data.server.load[0]?.toFixed(2) ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">
                    RAM · {pct(data.server.memTotal - data.server.memFree, data.server.memTotal)}% en uso
                  </p>
                  <p className="text-lg font-semibold">
                    {fmtBytes(data.server.memTotal - data.server.memFree)}
                    <span className="text-sm font-normal text-neutral-400">
                      {" "}
                      de {fmtBytes(data.server.memTotal)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">
                    Disco ·{" "}
                    {data.server.disk
                      ? `${pct(data.server.disk.total - data.server.disk.free, data.server.disk.total)}% en uso`
                      : "sin datos"}
                  </p>
                  <p className="text-lg font-semibold">
                    {data.server.disk
                      ? `${fmtBytes(data.server.disk.total - data.server.disk.free)} de ${fmtBytes(data.server.disk.total)}`
                      : "—"}
                  </p>
                </div>
              </div>
              {data.pm2.length === 0 && (
                <p className="mt-4 text-sm text-amber-300">
                  No se pudo leer la lista de PM2 en este servidor; la salud HTTP
                  de arriba sigue funcionando.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
