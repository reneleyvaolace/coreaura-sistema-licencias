// app/api/public/deactivate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, domain } = body;

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

    // Obtener activaciones actuales
    const activations = licenseData.activations || [];

    // Filtrar para remover el dominio
    const updatedActivations = activations.filter((act: any) => act.domain !== domain);

    if (activations.length === updatedActivations.length) {
      return NextResponse.json(
        { success: false, message: "Dominio no encontrado en activaciones" },
        { status: 404 }
      );
    }

    await adminDB.collection("licenses").doc(licenseDoc.id).update({
      activations: updatedActivations,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Licencia desactivada del dominio",
        remainingActivations: updatedActivations.map((act: any) => act.domain),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al desactivar licencia:", error);
    return NextResponse.json(
      { success: false, message: "Error al desactivar licencia" },
      { status: 500 }
    );
  }
}
