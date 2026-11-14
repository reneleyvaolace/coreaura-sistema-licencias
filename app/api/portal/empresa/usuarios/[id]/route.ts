// app/api/portal/empresa/usuarios/[id]/route.ts
// Portal de cliente: editar o eliminar un usuario de la empresa.
// Solo el administrador de la empresa.
import { NextRequest, NextResponse } from "next/server";
import { adminDB, firebaseAdminApp } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";
import { getAuth } from "firebase-admin/auth";

export const dynamic = "force-dynamic";

const PERFILES_EMPRESA = ["company_admin", "user", "auditor", "viewer"];

async function getEmpresaAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token || !token.email) {
    return { error: "No autorizado", status: 401 };
  }
  const snap = await adminDB
    .collection("users")
    .where("email", "==", token.email)
    .limit(1)
    .get();
  if (snap.empty) {
    return { error: "Solo el administrador de la empresa puede hacer esto", status: 403 };
  }
  const ficha = snap.docs[0].data() as Record<string, unknown>;
  if (ficha.role !== "company_admin" || !ficha.clientId) {
    return { error: "Solo el administrador de la empresa puede hacer esto", status: 403 };
  }
  return { clientId: ficha.clientId as string };
}

async function getUsuarioDeEmpresa(clientId: string, id: string) {
  const doc = await adminDB.collection("users").doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data() as Record<string, unknown>;
  if (data.clientId !== clientId) return null;
  return { id: doc.id, ...data };
}

// PUT: Editar nombre, perfil o estado del usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getEmpresaAdmin(request);
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }
    const { id } = await params;
    const usuario = await getUsuarioDeEmpresa(admin.clientId, id);
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    const body = await request.json();
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }
    if (typeof body.role === "string") {
      if (!PERFILES_EMPRESA.includes(body.role)) {
        return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
      }
      updateData.role = body.role;
    }
    if (typeof body.active === "boolean") {
      updateData.active = body.active;
    }

    await adminDB.collection("users").doc(id).update(updateData);

    // Al desactivar, también se bloquea su acceso; al reactivar, se desbloquea.
    if (typeof body.active === "boolean" && typeof usuario.email === "string") {
      try {
        const auth = getAuth(firebaseAdminApp);
        const authUser = await auth.getUserByEmail(usuario.email);
        await auth.updateUser(authUser.uid, { disabled: !body.active });
      } catch (e) {
        console.error("No se pudo actualizar el acceso del usuario:", e);
      }
    }

    return NextResponse.json({ message: "Usuario actualizado" }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar el usuario de la empresa:", error);
    return NextResponse.json(
      { error: "Error al actualizar el usuario" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar al usuario y cancelar sus licencias de usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getEmpresaAdmin(request);
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }
    const { id } = await params;
    const usuario = await getUsuarioDeEmpresa(admin.clientId, id);
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Cancelar sus licencias de usuario (libera los asientos).
    const lics = await adminDB
      .collection("licenses")
      .where("usuario", "==", usuario.email)
      .get();
    for (const doc of lics.docs) {
      const data = doc.data() as Record<string, unknown>;
      if (data.clienteId === admin.clientId) {
        await doc.ref.update({ estado: "cancelada" });
      }
    }

    await adminDB.collection("users").doc(id).delete();

    // Eliminar su cuenta de acceso (si existe).
    if (typeof usuario.email === "string") {
      try {
        const auth = getAuth(firebaseAdminApp);
        const authUser = await auth.getUserByEmail(usuario.email);
        await auth.deleteUser(authUser.uid);
      } catch (e) {
        console.error("No se pudo eliminar la cuenta de acceso:", e);
      }
    }

    return NextResponse.json({ message: "Usuario eliminado" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar el usuario de la empresa:", error);
    return NextResponse.json(
      { error: "Error al eliminar el usuario" },
      { status: 500 }
    );
  }
}
