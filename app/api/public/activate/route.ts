// app/api/public/activate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, domain, product } = body;

    if (!licenseKey || !domain) {
      return NextResponse.json(
        { success: false, message: "License key y domain son requeridos" },
        { status: 400 }
      );
    }

    // Buscar la licencia
    const licensesSnapshot = await adminDB
      .collection("licenses")
      .where("licenseKey", "==", licenseKey)
      .get();

    if (licensesSnapshot.empty) {
      return NextResponse.json(
        { success: false, message: "Licencia no encontrada" },
        { status: 404 }
      );
    }

    const licenseDoc = licensesSnapshot.docs[0];
    const licenseData = licenseDoc.data();

    // Validar estado
    if (licenseData.estado !== "activa") {
      return NextResponse.json(
        { success: false, message: `Licencia ${licenseData.estado}` },
        { status: 403 }
      );
    }

    // Validar producto
    if (product && licenseData.producto !== product) {
      return NextResponse.json(
        { success: false, message: "Licencia no válida para este producto" },
        { status: 403 }
      );
    }

    // Obtener activaciones actuales
    const activations = licenseData.activations || [];
    const maxActivations = licenseData.maxActivations || 1;

    // Verificar si el dominio ya está activado
    const existingActivation = activations.find((act: any) => act.domain === domain);
    
    if (existingActivation) {
      // Actualizar última verificación
      const updatedActivations = activations.map((act: any) =>
        act.domain === domain
          ? { ...act, lastCheck: new Date().toISOString() }
          : act
      );

      await adminDB.collection("licenses").doc(licenseDoc.id).update({
        activations: updatedActivations,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Licencia ya activada en este dominio",
          activation: {
            domain,
            activatedAt: existingActivation.activatedAt,
          },
        },
        { status: 200 }
      );
    }

    // Verificar límite de activaciones
    if (activations.length >= maxActivations) {
      return NextResponse.json(
        {
          success: false,
          message: `Límite de activaciones alcanzado (${maxActivations} sitio(s))`,
          activations: activations.map((act: any) => act.domain),
        },
        { status: 403 }
      );
    }

    // Agregar nueva activación
    const newActivation = {
      domain,
      activatedAt: new Date().toISOString(),
      lastCheck: new Date().toISOString(),
    };

    activations.push(newActivation);

    await adminDB.collection("licenses").doc(licenseDoc.id).update({
      activations,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Licencia activada exitosamente",
        activation: newActivation,
        remainingActivations: maxActivations - activations.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al activar licencia:", error);
    return NextResponse.json(
      { success: false, message: "Error al activar licencia" },
      { status: 500 }
    );
  }
}
