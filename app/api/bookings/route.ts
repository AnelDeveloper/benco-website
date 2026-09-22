import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { bookingSchema } from '@/lib/validation/requests';
import { validateStay, toDateRange, totalPrice, nightsBetween } from '@/lib/booking';
import { isOverLimit, clientIp, WINDOW_MINUTES } from '@/lib/rate-limit';
import { sendBookingEmails } from '@/lib/email';

/** Postgres exclusion-constraint violation: the dates overlap an existing stay. */
const EXCLUSION_VIOLATION = '23P01';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Neispravni podaci.' },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const stay = validateStay(input.checkIn, input.checkOut);
  if (!stay.ok) return NextResponse.json({ error: stay.error }, { status: 400 });

  const db = createAdminClient();
  const ip = clientIp(request.headers);
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const [byEmail, byIp] = await Promise.all([
    db
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('guest_email', input.email)
      .gte('created_at', since),
    ip
      ? db
          .from('reservations')
          .select('id', { count: 'exact', head: true })
          .eq('ip', ip)
          .gte('created_at', since)
      : Promise.resolve({ count: 0 }),
  ]);

  if (isOverLimit({ byEmail: byEmail.count ?? 0, byIp: byIp.count ?? 0 })) {
    return NextResponse.json(
      { error: 'Previše pokušaja. Pokušajte ponovo kasnije ili nas nazovite.' },
      { status: 429 },
    );
  }

  const { data: property } = await db
    .from('properties')
    .select('id, title_bs, price_per_night, currency, listing_mode, max_guests, is_published')
    .eq('id', input.propertyId)
    .maybeSingle();

  if (!property || !property.is_published || property.listing_mode === 'sale') {
    return NextResponse.json({ error: 'Nekretnina nije dostupna za najam.' }, { status: 404 });
  }

  if (property.max_guests && input.guests > property.max_guests) {
    return NextResponse.json(
      { error: `Maksimalan broj gostiju je ${property.max_guests}.` },
      { status: 400 },
    );
  }

  const nights = nightsBetween(input.checkIn, input.checkOut);
  const price = totalPrice(property.price_per_night, nights);

  // Insert directly and let the database reject overlaps. Checking availability
  // first would leave a window in which another guest books the same dates.
  const { error } = await db.from('reservations').insert({
    property_id: property.id,
    period: toDateRange(input.checkIn, input.checkOut),
    kind: 'booking',
    status: 'confirmed',
    guest_name: input.name,
    guest_email: input.email,
    guest_phone: input.phone ?? null,
    guests: input.guests,
    message: input.message ?? null,
    total_price: price,
    ip,
  });

  if (error) {
    if (error.code === EXCLUSION_VIOLATION) {
      return NextResponse.json(
        { error: 'Nažalost, ti datumi su upravo rezervisani. Odaberite druge datume.' },
        { status: 409 },
      );
    }
    console.error('Booking insert failed:', error);
    return NextResponse.json({ error: 'Greška pri rezervaciji. Pokušajte ponovo.' }, { status: 500 });
  }

  // The booking is stored and the dates are locked; email problems must not
  // turn a successful booking into an error for the guest.
  await sendBookingEmails({
    propertyTitle: property.title_bs,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights,
    guestName: input.name,
    guestEmail: input.email,
    guestPhone: input.phone,
    guests: input.guests,
    totalPrice: price,
    currency: property.currency,
    message: input.message,
  });

  return NextResponse.json({ ok: true, nights, totalPrice: price, currency: property.currency }, { status: 201 });
}
