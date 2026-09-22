import { NextResponse } from 'next/server';
import { createAnonClient } from '@/lib/supabase/anon';
import { parseAvailability } from '@/lib/booking';

/**
 * Occupied date ranges for one property.
 *
 * Reads the public_availability view through the anon key, which exposes only
 * property_id and the date range — never guest names, emails or phone numbers.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  const { propertyId } = await params;
  const supabase = createAnonClient();

  if (!supabase) return NextResponse.json({ occupied: [] });

  const { data, error } = await supabase
    .from('public_availability')
    .select('period')
    .eq('property_id', propertyId);

  if (error) {
    console.error('availability lookup failed:', error);
    return NextResponse.json({ occupied: [] });
  }

  return NextResponse.json(
    { occupied: parseAvailability((data ?? []) as { period: string }[]) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
