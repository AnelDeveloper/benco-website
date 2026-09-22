import 'server-only';
import { Resend } from 'resend';

const FROM = 'Ben&Co <onboarding@resend.dev>';

function owner(): string {
  return process.env.CONTACT_EMAIL ?? 'realestatebenco@gmail.com';
}

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(title: string, rows: [string, string][], footer?: string): string {
  const cells = rows
    .filter(([, value]) => value !== '' && value != null)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:13px;width:160px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;">${escapeHtml(value).replace(/\n/g, '<br>')}</td>
        </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Arial,sans-serif;">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#0f172a;padding:24px;">
      <div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:.5px;">BEN&amp;CO</div>
      <div style="color:#f59e0b;font-size:14px;margin-top:4px;">${escapeHtml(title)}</div>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;">${cells}</table>
      ${footer ? `<p style="margin-top:20px;color:#64748b;font-size:12px;">${escapeHtml(footer)}</p>` : ''}
    </div>
  </div>
</body></html>`;
}

/**
 * Sending must never break the thing it reports.
 *
 * A booking is already stored and its dates already locked by the time we email;
 * throwing here would tell the guest their booking failed when it did not.
 */
async function send(options: {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const resend = client();
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping email:', options.subject);
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: options.to,
      replyTo: options.replyTo,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', options.subject, error);
    return false;
  }
}

export type BookingEmail = {
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  guests: number;
  totalPrice: number | null;
  currency: string;
  message?: string | null;
};

export async function sendBookingEmails(booking: BookingEmail) {
  const price =
    booking.totalPrice === null ? '' : `${booking.totalPrice} ${booking.currency}`;

  const rows: [string, string][] = [
    ['Nekretnina', booking.propertyTitle],
    ['Dolazak', booking.checkIn],
    ['Odlazak', booking.checkOut],
    ['Broj noći', String(booking.nights)],
    ['Gostiju', String(booking.guests)],
    ['Ukupno', price],
  ];

  await Promise.all([
    send({
      to: [owner()],
      replyTo: booking.guestEmail,
      subject: `Nova rezervacija: ${booking.propertyTitle} (${booking.checkIn})`,
      html: layout('Nova rezervacija', [
        ...rows,
        ['Gost', booking.guestName],
        ['Email', booking.guestEmail],
        ['Telefon', booking.guestPhone ?? ''],
        ['Poruka', booking.message ?? ''],
      ]),
    }),
    send({
      to: [booking.guestEmail],
      subject: `Potvrda rezervacije — ${booking.propertyTitle}`,
      html: layout(
        'Vaša rezervacija je potvrđena',
        rows,
        'Termin je rezervisan za vas. Kontaktiramo vas uskoro oko detalja plaćanja i primopredaje ključeva.',
      ),
    }),
  ]);
}

export type RequestEmail = {
  kind: 'purchase' | 'offplan' | 'investment';
  subjectTitle: string;
  name: string;
  email: string;
  phone?: string | null;
  amount?: number | null;
  units?: number | null;
  currency: string;
  message?: string | null;
};

const KIND_LABEL: Record<RequestEmail['kind'], string> = {
  purchase: 'Ponuda za kupovinu',
  offplan: 'Kupovina u izgradnji',
  investment: 'Upit za ulaganje',
};

export async function sendRequestEmail(request: RequestEmail) {
  const label = KIND_LABEL[request.kind];

  await send({
    to: [owner()],
    replyTo: request.email,
    subject: `${label}: ${request.subjectTitle}`,
    html: layout(label, [
      ['Predmet', request.subjectTitle],
      ['Ime', request.name],
      ['Email', request.email],
      ['Telefon', request.phone ?? ''],
      ['Iznos', request.amount ? `${request.amount} ${request.currency}` : ''],
      ['Broj jedinica', request.units ? String(request.units) : ''],
      ['Poruka', request.message ?? ''],
    ]),
  });
}

export async function sendContactEmail(contact: {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}) {
  return send({
    to: [owner()],
    replyTo: contact.email,
    subject: `Nova poruka sa website-a od ${contact.name}`,
    html: layout('Nova poruka sa website-a', [
      ['Ime', contact.name],
      ['Email', contact.email],
      ['Telefon', contact.phone ?? ''],
      ['Poruka', contact.message],
    ]),
  });
}
