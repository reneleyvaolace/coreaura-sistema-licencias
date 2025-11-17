// app/api/public/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, product, domain } = body;

    if (!licenseKey) {
      return NextResponse.json(
        { valid: false, message: "License key es requerido" },
        { status: 400 }
      );
    }

    // Buscar la licencia en Firestore
    const licensesSnapshot = await adminDB
      .collection("licenses")
      .where("licenseKey", "==", licenseKey)
      .get();

    if (licensesSnapshot.empty) {
      return NextResponse.json(
        { valid: false, message: "Licencia no encontrada" },
        { status: 404 }
      );
    }

    const licenseDoc = licensesSnapshot.docs[0];
    const licenseData = licenseDoc.data();

    // Validar producto si se especifica
    if (product && licenseData.producto !== product) {
      return NextResponse.json(
        { valid: false, message: "Licencia no válida para este producto" },
        { status: 403 }
      );
    }

    // Validar estado
    if (licenseData.estado !== "activa") {
      return NextResponse.json(
        {
          valid: false,
          message: `Licencia ${licenseData.estado}`,
          status: licenseData.estado,
        },
        { status: 403 }
      );
    }

    // Validar dominio si se especifica
    if (domain) {
      const activations = licenseData.activations || [];
      const isDomainActive = activations.some((act: any) => act.domain === domain);

      if (!isDomainActive) {
        return NextResponse.json(
          { 
            valid: false, 
            message: "Licencia no activada para este dominio",
            hint: "Use /api/public/activate para activar la licencia en este dominio"
          },
          { status: 403 }
        );
      }

      // Actualizar última verificación del dominio
      const updatedActivations = activations.map((act: any) =>
        act.domain === domain
          ? { ...act, lastCheck: new Date().toISOString() }
          : act
      );

      await adminDB.collection("licenses").doc(licenseDoc.id).update({
        activations: updatedActivations,
      });
    }

    // Validar fecha de expiración si existe
    if (licenseData.fechaExpiracion) {
      const expirationDate = new Date(licenseData.fechaExpiracion);
      if (expirationDate < new Date()) {
        // Actualizar estado a expirada
        await adminDB.collection("licenses").doc(licenseDoc.id).update({
          estado: "expirada",
        });

        return NextResponse.json(
          { valid: false, message: "Licencia expirada" },
          { status: 403 }
        );
      }
    }

    // Preparar datos de activaciones si existen
    const activationsData = licenseData.activations || [];
    const maxActivations = licenseData.maxActivations || 1;

    // Licencia válida
    return NextResponse.json(
      {
        valid: true,
        message: "Licencia válida",
        license: {
          key: licenseData.licenseKey,
          product: licenseData.producto,
          user: licenseData.usuario,
          status: licenseData.estado,
          createdAt: licenseData.fechaCreacion,
          expiresAt: licenseData.fechaExpiracion || null,
          activations: {
            current: activationsData.length,
            max: maxActivations,
            domains: activationsData.map((act: any) => ({
              domain: act.domain,
              activatedAt: act.activatedAt,
              lastCheck: act.lastCheck,
            })),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al validar licencia:", error);
    return NextResponse.json(
      { valid: false, message: "Error al validar licencia" },
      { status: 500 }
    );
  }
}
