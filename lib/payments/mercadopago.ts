// lib/payments/mercadopago.ts
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Obtén tu Access Token de .env.local
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

if (!accessToken) {
  console.warn('Advertencia: MERCADOPAGO_ACCESS_TOKEN no está configurado.');
}

// Inicializa el cliente de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: accessToken,
  options: {
    timeout: 5000,
  },
});

// Crea una instancia del servicio de Preferencias
export const preferenceClient = new Preference(client);