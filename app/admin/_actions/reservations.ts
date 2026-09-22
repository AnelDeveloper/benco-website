'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { toDateRange, validateStay } from '@/lib/booking';

export type BlockState = { error: string | null; message: string | null };

/**
 * Cancelling sets status to 'cancelled' rather than deleting the row.
 * The exclusion constraint only applies to confirmed rows, so the dates free up
 * immediately while the record of who booked them is kept.
 */
export async function cancelReservation(id: string) {
  await requireAdmin();
  const db = createAdminClient();

  await db
    .from('reservations')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', id);

  revalidatePath('/admin/reservations');
  revalidatePath('/', 'layout');
}

export async function blockDates(
  _prev: BlockState,
  formData: FormData,
): Promise<BlockState> {
  await requireAdmin();

  const propertyId = String(formData.get('property_id') ?? '');
  const from = String(formData.get('from') ?? '');
  const to = String(formData.get('to') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();

  if (!propertyId) return { error: 'Odaberite nekretninu.', message: null };

  const stay = validateStay(from, to);
  if (!stay.ok) return { error: stay.error, message: null };

  const db = createAdminClient();
  const { error } = await db.from('reservations').insert({
    property_id: propertyId,
    period: toDateRange(from, to),
    kind: 'block',
    status: 'confirmed',
    reason: reason || null,
  });

  if (error) {
    if (error.code === '23P01') {
      return { error: 'Ti datumi se preklapaju sa postojećom rezervacijom.', message: null };
    }
    return { error: `Greška: ${error.message}`, message: null };
  }

  revalidatePath('/admin/reservations');
  revalidatePath('/', 'layout');
  return { error: null, message: 'Termin blokiran.' };
}
