// app/api/payments/mercadopago/create-preference/route.ts
import { NextRequest, NextResponse } from "next/server";
import { preferenceClient } from "@/lib/payments/mercadopago"; // Importa el archivo en minúsculas
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt"; // Corregido: 'as' por 'from'

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    const body = await request.json();
    const { planId, userEmail } = body;

    if (!planId || !userEmail) {
      return NextResponse.json(
        { error: "planId y userEmail son requeridos" },
        { status: 400 }
      );
    }

    // 1. Obtener el plan de Firestore
    const planDoc = await adminDB.collection("plans").doc(planId).get();
    if (!planDoc.exists) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const planData = planDoc.data()!;

    if (!planData.active) {
      return NextResponse.json({ error: "Plan no disponible" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    // 2. Crear la preferencia de MercadoPago
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: planId,
            title: `${planData.name} - ${planData.duration}`,
            description: `Acceso al plan ${planData.name} de CoreAura`,
            quantity: 1,
            unit_price: planData.price,
            currency_id: "USD", // Asegúrate que MP acepte USD en tu cuenta
          },
        ],
        payer: {
          email: userEmail,
        },
        back_urls: {
          success: `${baseUrl}/checkout/success?session_id={external_reference}`,
          failure: `${baseUrl}/checkout/cancel`,
          pending: `${baseUrl}/checkout/pending`,
        },
        auto_return: "approved",
        // Usamos external_reference para guardar nuestro ID de transacción
        external_reference: `MP_${Date.now()}_${planId}`,
        notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
        metadata: {
          planId: planId,
          userEmail: userEmail,
          planName: planData.name,
        },
      },
    });

    // 3. Guardar transacción pendiente en Firestore
    await adminDB.collection("transactions").add({
      preferenceId: preference.id,
      externalReference: preference.external_reference,
      planId,
      userEmail,
      amount: planData.price,
      currency: "USD",
      status: "pending",
      provider: "mercadopago",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point, // URL de checkout
    });

  } catch (error: any) {
    console.error("Error al crear preferencia MP:", error.cause || error);
    return NextResponse.json(
      { error: "Error al crear preferencia", details: error.message },
      { status: 500 }
    );
  }
}