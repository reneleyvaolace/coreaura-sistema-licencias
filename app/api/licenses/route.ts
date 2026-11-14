// app/api/licenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";
import { datosPlanParaLicencia } from "@/lib/licenses/vencimiento";

// GET: Listar todas las licencias
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const licensesSnapshot = await adminDB.collection("licenses").get();
    const licenses = licensesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ licenses }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener licencias:", error);
    return NextResponse.json({ error: "Error al obtener licencias" }, { status: 500 });
  }
}

// POST: Crear nueva licencia
// Si se envía planId, el vencimiento se calcula solo desde la duración del plan
// (mensual: +1 mes, anual: +1 año, de por vida: sin vencimiento).
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { producto, usuario, estado = "activa", planId = "" } = body;

    if (!producto || !usuario) {
      return NextResponse.json(
        { error: "Producto y usuario son requeridos" },
        { status: 400 }
      );
    }

    // Generar ID de licencia único
    const licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const fechaCreacion = new Date();

    let planData = null;
    if (planId) {
      planData = await datosPlanParaLicencia(planId, fechaCreacion);
      if (!planData) {
        return NextResponse.json(
          { error: "El plan no existe" },
          { status: 400 }
        );
      }
    }

    const newLicense = {
      licenseKey,
      producto,
      usuario,
      estado,
      planId: planData ? planData.planId : null,
      planName: planData ? planData.planName : null,
      duration: planData ? planData.duration : null,
      fechaCreacion: fechaCreacion.toISOString(),
      fechaExpiracion: planData ? planData.fechaExpiracion : null,
    };

    const docRef = await adminDB.collection("licenses").add(newLicense);

    return NextResponse.json(
      { message: "Licencia creada", id: docRef.id, license: newLicense },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear licencia:", error);
    return NextResponse.json({ error: "Error al crear licencia" }, { status: 500 });
  }
}
