// lib/crm/clients.ts
// Agregación de clientes para el centro administrativo.
// Un cliente es un correo que aparece como usuario registrado, titular de una
// licencia o pagador de una transacción. No crea ni modifica datos, solo lee
// las colecciones users, licenses y transactions de Firestore.

import type { Firestore } from "firebase-admin/firestore";

export interface LicenciaCliente {
  id: string;
  producto: string;
  clave: string;
  estado: string;
  planName: string | null;
  fechaExpiracion: string | null;
}

export interface TotalPagado {
  moneda: string;
  total: number;
}

export interface FichaCliente {
  id: string;
  email: string;
  empresa: string;
  razonSocial: string | null;
  rfc: string | null;
  regimenFiscal: string | null;
  codigoPostal: string | null;
  contacto: string | null;
  telefono: string | null;
  notas: string | null;
}

export interface ClienteResumen {
  email: string;
  nombre: string | null;
  rol: string | null;
  activo: boolean | null;
  ficha: FichaCliente | null;
  rfc: string | null;
  licencias: LicenciaCliente[];
  licenciasActivas: number;
  planes: string[];
  proximoVencimiento: string | null;
  totales: TotalPagado[];
  ultimaActividad: string | null;
}

// Normaliza una fecha guardada como ISO string o como Timestamp de Firestore.
function fechaValida(v: unknown): string | null {
  if (typeof v === "string" && v) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : v;
  }
  if (v && typeof v === "object") {
    const maybe = v as { toDate?: unknown };
    if (typeof maybe.toDate === "function") {
      return (maybe.toDate as () => Date)().toISOString();
    }
  }
  return null;
}

export async function listarClientes(db: Firestore): Promise<ClienteResumen[]> {
  const [usersSnap, licensesSnap, txSnap, fichasSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("licenses").get(),
    db.collection("transactions").get(),
    db.collection("clients").get(),
  ]);

  const porEmail = new Map<string, ClienteResumen>();

  const obtener = (email: string): ClienteResumen => {
    let c = porEmail.get(email);
    if (!c) {
      c = {
        email,
        nombre: null,
        rol: null,
        activo: null,
        ficha: null,
        rfc: null,
        licencias: [],
        licenciasActivas: 0,
        planes: [],
        proximoVencimiento: null,
        totales: [],
        ultimaActividad: null,
      };
      porEmail.set(email, c);
    }
    return c;
  };

  const registrarActividad = (c: ClienteResumen, fecha: string | null) => {
    if (fecha && (!c.ultimaActividad || fecha > c.ultimaActividad)) {
      c.ultimaActividad = fecha;
    }
  };

  // La ficha de empresa manda sobre el nombre de usuario: es el nombre
  // comercial del cliente.
  for (const doc of fichasSnap.docs) {
    const d = doc.data();
    if (typeof d.email !== "string" || !d.email) continue;
    const c = obtener(d.email);
    const texto = (v: unknown): string | null =>
      typeof v === "string" && v ? v : null;
    c.ficha = {
      id: doc.id,
      email: d.email,
      empresa: typeof d.empresa === "string" ? d.empresa : "",
      razonSocial: texto(d.razonSocial),
      rfc: texto(d.rfc),
      regimenFiscal: texto(d.regimenFiscal),
      codigoPostal: texto(d.codigoPostal),
      contacto: texto(d.contacto),
      telefono: texto(d.telefono),
      notas: texto(d.notas),
    };
    if (c.ficha.empresa) c.nombre = c.ficha.empresa;
    if (c.ficha.rfc) c.rfc = c.ficha.rfc;
    registrarActividad(c, fechaValida(d.createdAt));
  }

  for (const doc of usersSnap.docs) {
    const d = doc.data();
    if (typeof d.email !== "string" || !d.email) continue;
    const c = obtener(d.email);
    if (!c.nombre) c.nombre = typeof d.name === "string" ? d.name : null;
    c.rol = typeof d.role === "string" ? d.role : null;
    c.activo = typeof d.active === "boolean" ? d.active : null;
    registrarActividad(c, fechaValida(d.createdAt));
  }

  for (const doc of licensesSnap.docs) {
    const d = doc.data();
    if (typeof d.usuario !== "string" || !d.usuario) continue;
    const c = obtener(d.usuario);
    const lic: LicenciaCliente = {
      id: doc.id,
      producto: typeof d.producto === "string" ? d.producto : "",
      clave: typeof d.licenseKey === "string" ? d.licenseKey : "",
      estado: typeof d.estado === "string" ? d.estado : "",
      planName: typeof d.planName === "string" ? d.planName : null,
      fechaExpiracion: fechaValida(d.fechaExpiracion),
    };
    c.licencias.push(lic);
    if (lic.estado === "activa") c.licenciasActivas += 1;
    if (lic.planName && !c.planes.includes(lic.planName)) c.planes.push(lic.planName);
    if (
      lic.fechaExpiracion &&
      lic.estado === "activa" &&
      (!c.proximoVencimiento || lic.fechaExpiracion < c.proximoVencimiento)
    ) {
      c.proximoVencimiento = lic.fechaExpiracion;
    }
    registrarActividad(c, fechaValida(d.fechaCreacion));
  }

  for (const doc of txSnap.docs) {
    const d = doc.data();
    if (typeof d.userEmail !== "string" || !d.userEmail) continue;
    const c = obtener(d.userEmail);
    if (d.status === "completed" && typeof d.amount === "number") {
      const moneda = typeof d.currency === "string" ? d.currency : "MXN";
      const t = c.totales.find((x) => x.moneda === moneda);
      if (t) t.total += d.amount;
      else c.totales.push({ moneda, total: d.amount });
    }
    registrarActividad(c, fechaValida(d.createdAt));
  }

  return [...porEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}
