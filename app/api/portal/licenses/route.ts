// app/api/portal/licenses/route.ts
// Portal de cliente: devuelve solo las licencias del usuario que inició sesión.
// Protegido con la sesión de next-auth, igual que el resto de rutas de la app.
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

// GET: Listar las licencias del usuario actual
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

    if (!token || !token.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const licensesSnapshot = await adminDB
      .collection("licenses")
      .where("usuario", "==", token.email)
      .get();

    const byId = new Map<string, Record<string, unknown>>();
    for (const doc of licensesSnapshot.docs) {
      byId.set(doc.id, { id: doc.id, ...doc.data() });
    }

    // El administrador de la empresa ve también todas las licencias de su empresa.
    const fichaSnap = await adminDB
      .collection("users")
      .where("email", "==", token.email)
      .limit(1)
      .get();
    if (!fichaSnap.empty) {
      const ficha = fichaSnap.docs[0].data() as {
        role?: string;
        clientId?: string;
      };
      if (ficha.role === "company_admin" && ficha.clientId) {
        const empresaSnap = await adminDB
          .collection("licenses")
          .where("clienteId", "==", ficha.clientId)
          .get();
        for (const doc of empresaSnap.docs) {
          if (!byId.has(doc.id)) {
            byId.set(doc.id, { id: doc.id, ...doc.data() });
          }
        }
      }
    }

    const licenses = [...byId.values()];

    return NextResponse.json({ licenses }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener licencias del cliente:", error);
    return NextResponse.json({ error: "Error al obtener licencias" }, { status: 500 });
  }
}
