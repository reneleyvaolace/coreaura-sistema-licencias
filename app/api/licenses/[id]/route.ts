// app/api/licenses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";

// PUT: Actualizar licencia
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

    await adminDB.collection("licenses").doc(id).update(body);

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
