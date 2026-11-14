// app/api/admin/monitor/route.ts
// Monitoreo del centro administrativo: estado de PM2, salud HTTP de las
// tres apps y métricas del servidor admin. Protegido con la sesión de
// next-auth, igual que el resto de rutas de la app.
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import fs from "fs";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

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

async function getPm2(): Promise<Pm2Proc[]> {
  try {
    const { stdout } = await execFileAsync("pm2", ["jlist"], {
      timeout: 8000,
    });
    const list = JSON.parse(stdout) as Array<{
      name: string;
      pid: number;
      monit?: { cpu?: number; memory?: number };
      pm2_env?: { status?: string; pm_uptime?: number; restart_time?: number };
    }>;
    return list.map((p) => ({
      name: p.name,
      status: p.pm2_env?.status ?? "unknown",
      cpu: p.monit?.cpu ?? 0,
      memory: p.monit?.memory ?? 0,
      uptime: p.pm2_env?.pm_uptime ?? 0,
      restarts: p.pm2_env?.restart_time ?? 0,
      pid: p.pid,
    }));
  } catch {
    return [];
  }
}

async function checkHealth(name: string, url: string): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal, redirect: "manual" });
    clearTimeout(timer);
    return { name, url, ok: res.status < 500, status: res.status, ms: Date.now() - start };
  } catch {
    return { name, url, ok: false, status: 0, ms: Date.now() - start };
  }
}

function diskUsage(): { total: number; free: number } | null {
  try {
    const s = fs.statfsSync("/");
    return { total: s.bsize * s.blocks, free: s.bsize * s.bfree };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [pm2, licencias, staging, coreauraOs] = await Promise.all([
    getPm2(),
    checkHealth("Licencias", "http://localhost:3000/"),
    checkHealth("Staging", "http://localhost:3001/"),
    checkHealth("CoreAura OS", "http://160.34.219.62:3000/"),
  ]);

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    server: {
      hostname: os.hostname(),
      uptimeSec: os.uptime(),
      load: os.loadavg(),
      memTotal: os.totalmem(),
      memFree: os.freemem(),
      disk: diskUsage(),
    },
    pm2,
    health: [licencias, staging, coreauraOs],
  });
}
