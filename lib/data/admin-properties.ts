import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PropertyRow, PropertyImageRow } from '@/lib/supabase/types';

export type AdminPropertyListItem = PropertyRow & {
  property_images: Pick<PropertyImageRow, 'url' | 'sort_order'>[];
};

export async function listPropertiesForAdmin(): Promise<AdminPropertyListItem[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('properties')
    .select('*, property_images (url, sort_order)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listPropertiesForAdmin failed:', error);
    return [];
  }
  return (data ?? []) as AdminPropertyListItem[];
}

export async function getPropertyForAdmin(id: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from('properties')
    .select('*, property_images (id, url, alt_bs, alt_en, sort_order)')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as PropertyRow & { property_images: PropertyImageRow[] };
}

/** Cover photo is the lowest sort_order, matching what the public site shows. */
export function coverOf(images: { url: string; sort_order: number }[]): string | null {
  if (images.length === 0) return null;
  return [...images].sort((a, b) => a.sort_order - b.sort_order)[0].url;
}
