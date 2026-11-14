// app/api/portal/empresa/route.ts
// Portal de cliente: la empresa del administrador.
// Solo el administrador de la empresa (company_admin) puede verla y gestionar
// sus usuarios. Las licencias de usuario se descuentan de los asientos de la
// licencia de empresa.
import { NextRequest, NextResponse } from "next/server";
import { adminDB, firebaseAdminApp } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";
import { getAuth } from "firebase-admin/auth";
import { calcularVencimiento } from "@/lib/licenses/vencimiento";

export const dynamic = "force-dynamic";

const PERFILES_EMPRESA = ["company_admin", "user", "auditor", "viewer"];

// Fila de Firestore con su id. Sin esta anotación, TypeScript infiere solo
// { id: string } del spread y luego se queja al leer otros campos.
type DocData = Record<string, unknown> & { id: string };

async function getFichaUsuario(email: string): Promise<DocData | null> {
  const snap = await adminDB
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as Record<string, unknown>) };
}

async function getResumen(clientId: string) {
  const [empresaSnap, licenciasSnap, usuariosSnap] = await Promise.all([
    adminDB.collection("clients").doc(clientId).get(),
    adminDB.collection("licenses").where("clienteId", "==", clientId).get(),
    adminDB.collection("users").where("clientId", "==", clientId).get(),
  ]);

  const empresa = empresaSnap.exists
    ? { id: empresaSnap.id, ...empresaSnap.data() }
    : null;

  const todas: DocData[] = licenciasSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Record<string, unknown>),
  }));
  const licenciasEmpresa = todas.filter((l) => l.tipo === "empresa");
  const licenciasUsuario = todas.filter((l) => l.tipo !== "empresa");
  const usuarios: DocData[] = usuariosSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Record<string, unknown>),
  }));

  const activasEmpresa = licenciasEmpresa.filter((l) => l.estado === "activa");
  const totales = activasEmpresa.reduce(
    (n, l) => n + (typeof l.maxUsers === "number" ? l.maxUsers : 1),
    0
  );
  const idsEmpresaActiva = new Set(activasEmpresa.map((l) => l.id as string));
  const usados = licenciasUsuario.filter(
    (l) =>
      l.estado === "activa" &&
      typeof l.licenciaEmpresaId === "string" &&
      idsEmpresaActiva.has(l.licenciaEmpresaId)
  ).length;

  return {
    empresa,
    licenciasEmpresa,
    licenciasUsuario,
    usuarios,
    asientos: { usados, totales },
  };
}

async function getEmpresaAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token || !token.email) {
    return { error: "No autorizado", status: 401 };
  }
  const ficha = await getFichaUsuario(token.email);
  if (!ficha || ficha.role !== "company_admin" || !ficha.clientId) {
    return {
      error: "Solo el administrador de la empresa puede ver esta sección",
      status: 403,
    };
  }
  return { email: token.email, clientId: ficha.clientId as string };
}

// GET: Resumen de la empresa (licencias, usuarios, asientos)
export async function GET(request: NextRequest) {
  try {
    const admin = await getEmpresaAdmin(request);
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }
    const resumen = await getResumen(admin.clientId);
    return NextResponse.json(resumen, { status: 200 });
  } catch (error) {
    console.error("Error al obtener la empresa:", error);
    return NextResponse.json({ error: "Error al obtener la empresa" }, { status: 500 });
  }
}

// POST: Crear un usuario de la empresa y asignarle una licencia de usuario
export async function POST(request: NextRequest) {
  try {
    const admin = await getEmpresaAdmin(request);
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }
    const body = await request.json();
    const { nombre, email, perfil, password } = body;

    if (!nombre || !email || !email.includes("@") || !perfil || !password) {
      return NextResponse.json(
        { error: "Nombre, correo, perfil y contraseña son requeridos" },
        { status: 400 }
      );
    }
    if (!PERFILES_EMPRESA.includes(perfil)) {
      return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const resumen = await getResumen(admin.clientId);
    if (resumen.asientos.usados >= resumen.asientos.totales) {
      return NextResponse.json(
        { error: "La empresa ya no tiene licencias de usuario disponibles" },
        { status: 400 }
      );
    }

    // Licencia de empresa con asientos libres (la primera que tenga).
    const empresaLicencia = resumen.licenciasEmpresa.find((l) => {
      if (l.estado !== "activa") return false;
      const max = typeof l.maxUsers === "number" ? l.maxUsers : 1;
      const usados = resumen.licenciasUsuario.filter(
        (u) => u.estado === "activa" && u.licenciaEmpresaId === l.id
      ).length;
      return usados < max;
    });
    if (!empresaLicencia) {
      return NextResponse.json(
        { error: "La empresa ya no tiene licencias de usuario disponibles" },
        { status: 400 }
      );
    }

    // ¿Ya existe un usuario con ese correo?
    const existente = await adminDB
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!existente.empty) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese correo" },
        { status: 400 }
      );
    }

    // Crear la cuenta de acceso (Firebase Auth).
    const auth = getAuth(firebaseAdminApp);
    try {
      await auth.createUser({ email, password, displayName: nombre });
    } catch (e: any) {
      if (e?.code === "auth/email-already-exists") {
        return NextResponse.json(
          { error: "Ya existe una cuenta con ese correo" },
          { status: 400 }
        );
      }
      throw e;
    }

    const ahora = new Date();
    const userRef = await adminDB.collection("users").add({
      email,
      name: nombre,
      role: perfil,
      active: true,
      clientId: admin.clientId,
      createdAt: ahora.toISOString(),
      updatedAt: ahora.toISOString(),
    });

    const licenseKey = `LIC-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
    const licRef = await adminDB.collection("licenses").add({
      licenseKey,
      producto: empresaLicencia.producto,
      usuario: email,
      estado: "activa",
      tipo: "usuario",
      clienteId: admin.clientId,
      licenciaEmpresaId: empresaLicencia.id,
      maxUsers: null,
      planId: empresaLicencia.planId ?? null,
      planName: empresaLicencia.planName ?? null,
      duration: empresaLicencia.duration ?? null,
      fechaCreacion: ahora.toISOString(),
      fechaExpiracion: calcularVencimiento(
        (empresaLicencia.duration as string) ?? "monthly",
        ahora
      ),
    });

    return NextResponse.json(
      {
        message: "Usuario creado",
        id: userRef.id,
        licenseId: licRef.id,
        licenseKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear el usuario de la empresa:", error);
    return NextResponse.json(
      { error: "Error al crear el usuario" },
      { status: 500 }
    );
  }
}
