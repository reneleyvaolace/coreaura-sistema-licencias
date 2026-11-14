// app/api/admin/clientes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { adminDB } from "@/lib/firebase/admin";
import { listarClientes } from "@/lib/crm/clients";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clientes = await listarClientes(adminDB);
    return NextResponse.json({ clientes }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
