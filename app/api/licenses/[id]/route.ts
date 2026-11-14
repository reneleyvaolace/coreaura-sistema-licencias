// app/api/licenses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";
import { datosPlanParaLicencia } from "@/lib/licenses/vencimiento";

// PUT: Actualizar licencia
// Si el plan cambia, el vencimiento se recalcula desde la duración del plan nuevo.
// Si el plan no cambia, el vencimiento se queda como está.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = { ...body };

    if ("planId" in body) {
      const currentDoc = await adminDB.collection("licenses").doc(id).get();
      const currentPlanId = currentDoc.exists
        ? ((currentDoc.data() as { planId?: string | null }).planId ?? null)
        : null;

      if (body.planId !== currentPlanId) {
        if (body.planId) {
          const planData = await datosPlanParaLicencia(body.planId, new Date());
          if (!planData) {
            return NextResponse.json(
              { error: "El plan no existe" },
              { status: 400 }
            );
          }
          Object.assign(updateData, planData);
        } else {
          updateData.planId = null;
          updateData.planName = null;
          updateData.duration = null;
          updateData.fechaExpiracion = null;
        }
      } else {
        // El plan no cambió: no tocar los datos del plan ni el vencimiento.
        delete updateData.planName;
        delete updateData.duration;
        delete updateData.fechaExpiracion;
      }
    }

    await adminDB.collection("licenses").doc(id).update(updateData);

    return NextResponse.json({ message: "Licencia actualizada" }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar licencia:", error);
    return NextResponse.json({ error: "Error al actualizar licencia" }, { status: 500 });
  }
}

// DELETE: Eliminar licencia
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await adminDB.collection("licenses").doc(id).delete();

    return NextResponse.json({ message: "Licencia eliminada" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar licencia:", error);
    return NextResponse.json({ error: "Error al eliminar licencia" }, { status: 500 });
  }
}
