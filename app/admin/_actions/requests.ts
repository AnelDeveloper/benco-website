'use server';

import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import type { RequestStatus } from '@/lib/supabase/types';

export async function setRequestStatus(id: string, status: RequestStatus) {
  await requireStaff();
  const db = createAdminClient();
  await db.from('requests').update({ status }).eq('id', id);
  revalidatePath('/admin/requests');
}

export async function saveRequestNote(id: string, formData: FormData) {
  await requireStaff();
  const db = createAdminClient();
  const note = String(formData.get('admin_notes') ?? '').trim();
  await db.from('requests').update({ admin_notes: note || null }).eq('id', id);
  revalidatePath('/admin/requests');
}
