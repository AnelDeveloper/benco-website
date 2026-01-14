import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Lazy initialization - samo kada je potreban
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY nije postavljen. Molimo dodaj ga u environment variables.');
  }
  return new Resend(apiKey);
};

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, message } = await request.json();

    // Validacija
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Molimo popunite sva obavezna polja' },
        { status: 400 }
      );
    }

    // Slanje emaila
    const resend = getResend();
    const data = await resend.emails.send({
      from: 'Ben&Co Website <onboarding@resend.dev>', // U production koristi svoju domenu
      to: ['realestatebenco@gmail.com'], // Tvoj email
      replyTo: email, // Email pošiljaoca
      subject: `Nova poruka sa website-a od ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .field { margin-bottom: 20px; }
              .label { font-weight: bold; color: #d97706; margin-bottom: 5px; }
              .value { background: white; padding: 10px; border-radius: 5px; border-left: 3px solid #d97706; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">BEN&CO</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Nova poruka sa website-a</p>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Ime:</div>
                  <div class="value">${name}</div>
                </div>
                
                <div class="field">
                  <div class="label">Email:</div>
                  <div class="value"><a href="mailto:${email}">${email}</a></div>
                </div>
                
                ${phone ? `
                <div class="field">
                  <div class="label">Telefon:</div>
                  <div class="value"><a href="tel:${phone}">${phone}</a></div>
                </div>
                ` : ''}
                
                <div class="field">
                  <div class="label">Poruka:</div>
                  <div class="value">${message.replace(/\n/g, '<br>')}</div>
                </div>
                
                <div class="footer">
                  <p>Poruka primljena: ${new Date().toLocaleString('bs-BA', { 
                    dateStyle: 'full', 
                    timeStyle: 'short',
                    timeZone: 'Europe/Sarajevo'
                  })}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email uspješno poslan',
      data 
    });
  } catch (error) {
    console.error('Greška pri slanju emaila:', error);
    return NextResponse.json(
      { error: 'Greška pri slanju emaila. Molimo pokušajte ponovo.' },
      { status: 500 }
    );
  }
}
