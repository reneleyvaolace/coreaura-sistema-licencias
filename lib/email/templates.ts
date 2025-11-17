// lib/email/templates.ts

/**
 * Plantilla de Email para Bienvenida y Entrega de Licencia
 */
export const getLicenseEmailTemplate = (
  userEmail: string,
  planName: string,
  licenseKey: string
) => {
  const subject = `¡Aquí está tu licencia para ${planName}!`;
  
  const htmlBody = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; }
      .container { width: 90%; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
      .header { background-color: #f9f9f9; padding: 20px; text-align: center; border-bottom: 1px solid #ddd; }
      .header h1 { color: #333; margin: 0; }
      .content { padding: 30px; }
      .content p { color: #555; }
      .license-box { background-color: #f0f0f0; border: 1px dashed #ccc; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
      .license-key { font-family: "Courier New", Courier, monospace; font-size: 1.2em; font-weight: bold; color: #000; }
      .button { display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
      .footer { background-color: #f9f9f9; padding: 20px; text-align: center; color: #888; font-size: 0.9em; border-top: 1px solid #ddd; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>CoreAura</h1>
      </div>
      <div class="content">
        <p>Hola ${userEmail},</p>
        <p>¡Gracias por tu compra del plan <strong>${planName}</strong>! Estamos encantados de tenerte a bordo.</p>
        <p>Aquí está tu clave de licencia. Guárdala en un lugar seguro:</p>
        
        <div class="license-box">
          <span class="license-key">${licenseKey}</span>
        </div>
        
        <p>Puedes gestionar todas tus licencias y activaciones desde tu panel de control:</p>
        
        <a href="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/dashboard/licenses" class="button">Ir a mi Dashboard</a>
        
        <p style="margin-top: 30px;">Gracias,<br>El equipo de CoreAura</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} CoreAura. Todos los derechos reservados.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  return { subject, htmlBody };
};