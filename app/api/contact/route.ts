import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { sendContactEmail } from '@/lib/email';

/**
 * Validation here is not only about empty fields.
 *
 * The parsed values flow into Resend's `replyTo`, so an unvalidated body could
 * pass an array or object where a single address is expected. Zod forces every
 * field to be a string of bounded length before it reaches the mail client.
 */
const contactSchema = z.object({
  name: z.string().trim().min(1, 'Ime je obavezno').max(120),
  email: z.string().trim().max(200).email('Unesite ispravnu email adresu'),
  phone: z.string().trim().max(50).optional().nullable(),
  message: z.string().trim().min(1, 'Poruka je obavezna').max(4000),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Molimo popunite sva obavezna polja' },
      { status: 400 },
    );
  }

  const sent = await sendContactEmail(parsed.data);

  if (!sent) {
    return NextResponse.json(
      { error: 'Greška pri slanju emaila. Molimo pokušajte ponovo.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, message: 'Email uspješno poslan' });
}
