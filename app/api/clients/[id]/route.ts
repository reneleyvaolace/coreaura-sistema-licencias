// app/api/clients/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";

// PUT: Actualizar la ficha de un cliente
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

    if (body.email && !body.email.includes("@")) {
      return NextResponse.json({ error: "El email no es válido" }, { status: 400 });
    }

    if (body.regimenFiscal && body.regimenFiscal.length !== 3) {
      return NextResponse.json(
        { error: "El régimen fiscal es la clave de 3 caracteres del SAT (ej. 601)" },
        { status: 400 }
      );
    }

    if (body.codigoPostal && !/^\d{5}$/.test(body.codigoPostal)) {
      return NextResponse.json(
        { error: "El código postal debe tener 5 dígitos" },
        { status: 400 }
      );
    }

    // Agregar timestamp de actualización
    body.updatedAt = new Date().toISOString();

    await adminDB.collection("clients").doc(id).update(body);

    return NextResponse.json({ message: "Cliente actualizado" }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
  }
}

// DELETE: Eliminar la ficha de un cliente.
// No se puede eliminar si el cliente tiene licencias registradas: primero
// habría que resolver esas licencias, para no dejarlas sin titular.
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
    const doc = await adminDB.collection("clients").doc(id).get();
    const email = doc.data()?.email;

    if (email) {
      const conLicencias = await adminDB
        .collection("licenses")
        .where("usuario", "==", email)
        .limit(1)
        .get();
      if (!conLicencias.empty) {
        return NextResponse.json(
          { error: "No se puede eliminar: el cliente tiene licencias registradas" },
          { status: 400 }
        );
      }
    }

    await adminDB.collection("clients").doc(id).delete();

    return NextResponse.json({ message: "Cliente eliminado" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 });
  }
}
