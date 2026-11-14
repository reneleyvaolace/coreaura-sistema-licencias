// app/api/portal/licenses/[id]/route.ts
// Portal de cliente: detalle de una licencia contratada.
// Solo el titular (usuario == email de la sesión) puede verla.
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

// GET: Detalle de una licencia del usuario actual
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

    if (!token || !token.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const docSnap = await adminDB.collection("licenses").doc(id).get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Licencia no encontrada" }, { status: 404 });
    }

    const license = { id: docSnap.id, ...docSnap.data() } as Record<string, unknown>;

    // No revelar si la licencia existe cuando no es del usuario.
    if (license.usuario !== token.email) {
      // El administrador de la empresa puede ver las licencias de su empresa.
      const fichaSnap = await adminDB
        .collection("users")
        .where("email", "==", token.email)
        .limit(1)
        .get();
      const ficha = fichaSnap.empty
        ? null
        : (fichaSnap.docs[0].data() as { role?: string; clientId?: string });
      const esEmpresaAdmin =
        ficha?.role === "company_admin" &&
        !!ficha.clientId &&
        license.clienteId === ficha.clientId;
      if (!esEmpresaAdmin) {
        return NextResponse.json({ error: "Licencia no encontrada" }, { status: 404 });
      }
    }

    // Plan contratado (si la licencia tiene planId)
    let plan: Record<string, unknown> | null = null;
    if (typeof license.planId === "string" && license.planId) {
      try {
        const planSnap = await adminDB.collection("plans").doc(license.planId).get();
        if (planSnap.exists) {
          plan = { id: planSnap.id, ...planSnap.data() };
        }
      } catch (e) {
        console.error("Error al obtener el plan de la licencia:", e);
      }
    }

    return NextResponse.json({ license, plan }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener el detalle de la licencia:", error);
    return NextResponse.json({ error: "Error al obtener la licencia" }, { status: 500 });
  }
}
