// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";

const SETTINGS_DOC_ID = "system_config";

// GET: Obtener configuración
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const settingsDoc = await adminDB.collection("settings").doc(SETTINGS_DOC_ID).get();
    
    if (!settingsDoc.exists) {
      // Valores por defecto si no existe configuración
      const defaultSettings = {
        siteName: "CoreAura License System",
        siteEmail: "admin@coreaura.ia",
        emailNotifications: true,
        allowRegistrations: true,
        maintenanceMode: false,
        updatedAt: new Date().toISOString(),
      };
      
      return NextResponse.json({ settings: defaultSettings }, { status: 200 });
    }

    return NextResponse.json({ settings: settingsDoc.data() }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 });
  }
}

// POST/PUT: Guardar configuración
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    
    const updatedSettings = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await adminDB.collection("settings").doc(SETTINGS_DOC_ID).set(updatedSettings, { merge: true });

    return NextResponse.json({ message: "Configuración guardada", settings: updatedSettings }, { status: 200 });
  } catch (error) {
    console.error("Error al guardar configuración:", error);
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 });
  }
}
