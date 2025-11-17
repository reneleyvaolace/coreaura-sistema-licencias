// app/api/payments/mercadopago/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { MercadoPagoConfig, Payment } from 'mercadopago'; // Esta importación no da error

// Inicializa el cliente (debe ser el mismo que el helper)
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const client = new MercadoPagoConfig({ accessToken });
const paymentClient = new Payment(client);

// Función para generar la licencia
async function generateLicense(payment: any) {
  const metadata = payment.metadata || {};
  const planId = metadata.plan_id as string;
  const userEmail = metadata.user_email as string;
  const planName = metadata.plan_name as string;

  if (!planId || !userEmail) {
    throw new Error("Webhook: Faltan metadatos (planId, userEmail)");
  }

  // Generar clave de licencia
  const licenseKey = `LIC-MP-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 6)
    .toUpperCase()}`;

  const newLicense = {
    licenseKey,
    producto: planName || "Plan MercadoPago",
    usuario: userEmail,
    estado: "activa",
    planId: planId,
    fechaCreacion: new Date().toISOString(),
    fechaExpiracion: null, // Ajustar si el plan tiene duración
    paymentId: payment.id.toString(),
    paymentProvider: "mercadopago",
    activations: [],
    maxActivations: 1, // O tomarlo del plan
  };

  await adminDB.collection("licenses").add(newLicense);

  // Actualizar la transacción en Firestore
  const externalReference = payment.external_reference;
  const transactionsSnapshot = await adminDB
    .collection("transactions")
    .where("externalReference", "==", externalReference)
    .limit(1)
    .get();

  if (!transactionsSnapshot.empty) {
    const txDocId = transactionsSnapshot.docs[0].id;
    await adminDB.collection("transactions").doc(txDocId).update({
      status: "completed",
      licenseKey,
      paymentId: payment.id.toString(),
      completedAt: new Date().toISOString(),
    });
  }

  console.log(`Licencia generada: ${licenseKey} para ${userEmail}`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // MercadoPago envía notificaciones de diferentes tipos
    // Nos interesa el 'payment'
    if (body.type === "payment") {
      const paymentId = body.data.id as string;

      // Obtener los detalles completos del pago desde MercadoPago
      const payment = await paymentClient.get({ id: paymentId });

      if (payment && payment.status === "approved") {
        // 1. Verificar si ya procesamos este pago
        const licensesSnapshot = await adminDB
          .collection("licenses")
          .where("paymentId", "==", paymentId)
          .limit(1)
          .get();

        if (licensesSnapshot.empty) {
          // 2. Si no, generar la licencia
          await generateLicense(payment);
        } else {
          console.log(`Webhook: Pago ${paymentId} ya fue procesado.`);
        }
      }
    }

    // Responder 200 OK a MercadoPago para que sepa que recibimos
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("Error en webhook MercadoPago:", error);
    return NextResponse.json(
      { error: "Error al procesar webhook", details: error.message },
      { status: 500 }
    );
  }
}