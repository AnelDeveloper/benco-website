import { requireAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { StatsForm } from '@/components/admin/StatsForm';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  await requireAdmin();
  const db = createAdminClient();
  const { data } = await db.from('site_stats').select('*').maybeSingle();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Statistika</h1>
      <p className="mb-6 mt-1 text-slate-600">
        Brojevi koji se animirano prikazuju na naslovnoj strani.
      </p>
      <StatsForm
        stats={{
          projects_completed: data?.projects_completed ?? 0,
          sqm_delivered: data?.sqm_delivered ?? 0,
          investors_count: data?.investors_count ?? 0,
          years_experience: data?.years_experience ?? 0,
        }}
      />
    </div>
  );
}
