import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requestSchema } from '@/lib/validation/requests';
import { isOverLimit, clientIp, WINDOW_MINUTES } from '@/lib/rate-limit';
import { sendRequestEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Neispravni podaci.' },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const db = createAdminClient();
  const ip = clientIp(request.headers);
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const [byEmail, byIp] = await Promise.all([
    db.from('requests').select('id', { count: 'exact', head: true }).eq('email', input.email).gte('created_at', since),
    ip
      ? db.from('requests').select('id', { count: 'exact', head: true }).eq('ip', ip).gte('created_at', since)
      : Promise.resolve({ count: 0 }),
  ]);

  if (isOverLimit({ byEmail: byEmail.count ?? 0, byIp: byIp.count ?? 0 })) {
    return NextResponse.json(
      { error: 'Previše pokušaja. Pokušajte ponovo kasnije ili nas nazovite.' },
      { status: 429 },
    );
  }

  // Resolve the subject so the notification email says what it is about, and so
  // a request cannot be filed against an unpublished or missing listing.
  let subjectTitle = '';
  let currency = 'BAM';

  if (input.kind === 'purchase') {
    const { data } = await db
      .from('properties')
      .select('title_bs, currency, is_published')
      .eq('id', input.propertyId!)
      .maybeSingle();
    if (!data?.is_published) {
      return NextResponse.json({ error: 'Nekretnina nije dostupna.' }, { status: 404 });
    }
    subjectTitle = data.title_bs;
    currency = data.currency;
  } else {
    const { data } = await db
      .from('projects')
      .select('title_bs, currency, is_published')
      .eq('id', input.projectId!)
      .maybeSingle();
    if (!data?.is_published) {
      return NextResponse.json({ error: 'Projekat nije dostupan.' }, { status: 404 });
    }
    subjectTitle = data.title_bs;
    currency = data.currency;
  }

  const { error } = await db.from('requests').insert({
    kind: input.kind,
    property_id: input.kind === 'purchase' ? input.propertyId : null,
    project_id: input.kind === 'purchase' ? null : input.projectId,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    message: input.message ?? null,
    amount: input.amount ?? null,
    units: input.units ?? null,
    ip,
  });

  if (error) {
    console.error('Request insert failed:', error);
    return NextResponse.json({ error: 'Greška pri slanju. Pokušajte ponovo.' }, { status: 500 });
  }

  await sendRequestEmail({
    kind: input.kind,
    subjectTitle,
    name: input.name,
    email: input.email,
    phone: input.phone,
    amount: input.amount,
    units: input.units,
    currency,
    message: input.message,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
