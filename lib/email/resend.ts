import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendLicenseEmail(to: string, licenseKey: string, productName: string, expiresAt: Date | null) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'CoreAura <s@coreaura.com>',
      to: [to],
      subject: `Your License Key for ${productName}`,
      html: `<p>Thank you for your purchase!</p>
             <p>Your license key is: <strong>${licenseKey}</strong></p>
             <p>Product: ${productName}</p>
             ${expiresAt ? `<p>Expires on: ${expiresAt.toDateString()}</p>` : ''}
             <p>Thank you for choosing CoreAura!</p>`,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception in sendLicenseEmail:', error);
    return { success: false, error };
  }
}