// app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";

// GET: Listar todas las fichas de clientes (empresas)
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clientsSnapshot = await adminDB.collection("clients").get();
    const clients = clientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ clients }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 });
  }
}

// POST: Crear una ficha de cliente (empresa)
// Campos fiscales (rfc, regimenFiscal, codigoPostal) opcionales al crear:
// se pueden completar después, pero son los que necesita Facturapi para
// facturarle a este cliente.
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      email,
      empresa,
      razonSocial = "",
      rfc = "",
      regimenFiscal = "",
      codigoPostal = "",
      contacto = "",
      telefono = "",
      notas = "",
    } = body;

    if (!email || !empresa) {
      return NextResponse.json(
        { error: "Email y empresa son requeridos" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "El email no es válido" }, { status: 400 });
    }

    if (regimenFiscal && regimenFiscal.length !== 3) {
      return NextResponse.json(
        { error: "El régimen fiscal es la clave de 3 caracteres del SAT (ej. 601)" },
        { status: 400 }
      );
    }

    if (codigoPostal && !/^\d{5}$/.test(codigoPostal)) {
      return NextResponse.json(
        { error: "El código postal debe tener 5 dígitos" },
        { status: 400 }
      );
    }

    const duplicado = await adminDB
      .collection("clients")
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!duplicado.empty) {
      return NextResponse.json(
        { error: "Ya existe una ficha para ese correo" },
        { status: 400 }
      );
    }

    const newClient = {
      email,
      empresa,
      razonSocial,
      rfc,
      regimenFiscal,
      codigoPostal,
      contacto,
      telefono,
      notas,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDB.collection("clients").add(newClient);

    return NextResponse.json(
      { message: "Cliente creado", id: docRef.id, client: newClient },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 });
  }
}
