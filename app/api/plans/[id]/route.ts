// app/api/plans/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";

// PUT: Actualizar plan
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

    if (body.price) {
      body.price = parseFloat(body.price);
    }

    body.updatedAt = new Date().toISOString();

    await adminDB.collection("plans").doc(id).update(body);

    return NextResponse.json({ message: "Plan actualizado" }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar plan:", error);
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 });
  }
}

// DELETE: Eliminar plan
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
    await adminDB.collection("plans").doc(id).delete();

    return NextResponse.json({ message: "Plan eliminado" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar plan:", error);
    return NextResponse.json({ error: "Error al eliminar plan" }, { status: 500 });
  }
}
