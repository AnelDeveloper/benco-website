import { NextResponse, type NextRequest } from 'next/server';
import { sendContactEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const { name, email, phone, message } = await request.json().catch(() => ({}));

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Molimo popunite sva obavezna polja' }, { status: 400 });
  }

  const sent = await sendContactEmail({ name, email, phone, message });

  if (!sent) {
    return NextResponse.json(
      { error: 'Greška pri slanju emaila. Molimo pokušajte ponovo.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, message: 'Email uspješno poslan' });
}
