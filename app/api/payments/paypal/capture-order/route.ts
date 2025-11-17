import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Client, OrdersController } from '@paypal/paypal-server-sdk';
import { Environment } from '@paypal/paypal-server-sdk';
import { adminDB } from '@/lib/firebase/admin';
import { generateLicenseKey } from '@/lib/licenses/generator';
import { sendLicenseEmail } from "@/lib/email/resend"; // <-- 1. IMPORTAR

// Inicializar cliente PayPal
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID!,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  },
  environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
  timeout: 0,
});

const ordersController = new OrdersController(client);

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const token = await getToken({ req, secret: process.env.AUTH_SECRET }); // Corregido: NEXTAUTH_SECRET a AUTH_SECRET
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId es requerido' }, { status: 400 });
    }

    // Capturar el pago con el nuevo SDK
    const collect = {
      id: orderId,
      prefer: 'return=representation',
    };

    const { result } = await ordersController.captureOrder(collect);

    // Verificar el estado de la captura
    if (result.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'El pago no se completó correctamente', status: result.status },
        { status: 400 }
      );
    }
    
    // --- INICIO DE LÓGICA DE LICENCIA ---
    
    // Evitar doble procesamiento
    const licenseSnapshot = await adminDB
      .collection("licenses")
      .where("paymentId", "==", orderId)
      .limit(1)
      .get();

    if (!licenseSnapshot.empty) {
      console.warn(`Pago de PayPal ${orderId} ya fue procesado.`);
      return NextResponse.json({
        success: true,
        message: "Pago ya procesado",
      });
    }

    // Extraer información del pedido
    const purchaseUnit = result.purchaseUnits?.[0];
    const customId = purchaseUnit?.customId;
    
    if (!customId) {
      return NextResponse.json({ error: 'No se encontró información del plan' }, { status: 400 });
    }

    const { planId, userId, userEmail } = JSON.parse(customId);

    // Obtener información del plan desde Firebase
    const planDoc = await adminDB.collection('plans').doc(planId).get();
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const planData = planDoc.data();

    // Obtener información del producto
    const productDoc = await adminDB.collection('products').doc(planData?.productId || '').get();
    const productData = productDoc.exists ? productDoc.data() : null;

    // Generar clave de licencia
    const licenseKey = generateLicenseKey(planData?.productId, userId); // Usando tu helper

    // Calcular fecha de expiración
    const now = new Date();
    let expiresAt = null;
    if (planData?.duration && planData.duration > 0) {
      expiresAt = new Date(now.getTime() + planData.duration * 24 * 60 * 60 * 1000);
    }

    // Crear licencia en Firebase
    const licenseRef = adminDB.collection('licenses').doc();
    await licenseRef.set({
      key: licenseKey,
      userId: userId,
      userEmail: userEmail,
      productId: planData?.productId || '',
      productName: productData?.name || 'Unknown Product',
      planId: planId,
      planName: planData?.name || '',
      status: 'activa',
      maxActivations: planData?.maxActivations || 1,
      activations: [],
      activationCount: 0,
      purchaseDate: now.toISOString(),
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      paymentMethod: 'paypal',
      paymentId: orderId,
      transactionId: result.id,
      amount: parseFloat(purchaseUnit?.amount?.value || '0'),
      currency: purchaseUnit?.amount?.currencyCode || 'USD',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // Crear registro de transacción
    const transactionRef = adminDB.collection('transactions').doc();
    await transactionRef.set({
      userId: userId,
      userEmail: userEmail,
      licenseId: licenseRef.id,
      licenseKey: licenseKey,
      paymentMethod: 'paypal',
      paymentId: orderId,
      transactionId: result.id,
      amount: parseFloat(purchaseUnit?.amount?.value || '0'),
      currency: purchaseUnit?.amount?.currencyCode || 'USD',
      status: 'completed',
      planId: planId,
      planName: planData?.name || '',
      productId: planData?.productId || '',
      productName: productData?.name || '',
      createdAt: now.toISOString(),
    });

    // --- 2. AÑADIR LLAMADA DE EMAIL ---
    try {
      await sendLicenseEmail(
        userEmail,
        licenseKey,
        planData?.name || productData?.name || 'tu plan',
        expiresAt
      );
    } catch (emailError) {
      console.error("Fallo al enviar email (PayPal), pero la licencia fue creada:", emailError);
      // No fallar la transacción si solo falla el email
    }
    
    // --- FIN DE LÓGICA DE LICENCIA ---

    return NextResponse.json({
      success: true,
      licenseKey: licenseKey,
      licenseId: licenseRef.id,
      transactionId: result.id,
      order: result,
    });
  } catch (error: any) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json(
      { error: 'Error al capturar el pago de PayPal', details: error.message },
      { status: 500 }
    );
  }
}