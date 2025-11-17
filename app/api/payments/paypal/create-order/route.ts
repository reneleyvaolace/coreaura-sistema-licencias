import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Client, OrdersController, CheckoutPaymentIntent } from '@paypal/paypal-server-sdk';
import { Environment } from '@paypal/paypal-server-sdk';

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
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { planId, userId, userEmail } = await req.json();

    if (!planId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'planId, userId y userEmail son requeridos' },
        { status: 400 }
      );
    }

    // Aquí deberías obtener los detalles del plan desde Firebase
    // Por ahora usamos un ejemplo
    const planAmount = '99.00'; // Obtener del plan real
    const planName = 'Plan Premium'; // Obtener del plan real

    // Crear orden con el nuevo SDK
    const collect = {
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            referenceId: `plan_${planId}_user_${userId}`,
            description: planName,
            amount: {
              currencyCode: 'USD',
              value: planAmount,
            },
            customId: JSON.stringify({
              planId,
              userId,
              userEmail,
            }),
          },
        ],
        applicationContext: {
          returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
          cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
          brandName: 'CoreAura License System',
        },
      },
      prefer: 'return=representation',
    };

    const { result } = await ordersController.createOrder(collect);

    return NextResponse.json({
      success: true,
      orderId: result.id,
      order: result,
    });
  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { error: 'Error al crear la orden de PayPal', details: error.message },
      { status: 500 }
    );
  }
}
