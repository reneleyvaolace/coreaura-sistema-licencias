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

    const licenses = licensesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ licenses }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener licencias del cliente:", error);
    return NextResponse.json({ error: "Error al obtener licencias" }, { status: 500 });
  }
}
