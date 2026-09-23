'use client';

import { useActionState } from 'react';
import { Shield, Headset, UserRound, Plus } from 'lucide-react';
import { createUser, setUserRole, deleteUser, type UserFormState } from '@/app/admin/_actions/users';
import { ROLE_LABEL, type Role } from '@/lib/auth/roles';
import { Field, SelectField, SubmitButton } from './Fields';
import { DeleteButton } from './DeleteButton';
import { formatDate } from '@/lib/format';

export type ListedUser = {
  email: string;
  role: Role;
  name: string | null;
  created_at: string;
  canSignIn: boolean;
};

const ROLE_STYLE: Record<Role, string> = {
  admin: 'bg-gold-600/15 text-gold-600',
  support: 'bg-blue-100 text-blue-700',
  user: 'bg-slate-100 text-slate-600',
};

const ROLE_ICON: Record<Role, typeof Shield> = {
  admin: Shield,
  support: Headset,
  user: UserRound,
};

const ROLE_OPTIONS = (['user', 'support', 'admin'] as Role[]).map((role) => ({
  value: role,
  label: ROLE_LABEL[role],
}));

export function UserList({ users, currentEmail }: { users: ListedUser[]; currentEmail: string }) {
  const [state, formAction] = useActionState<UserFormState, FormData>(createUser, {
    error: null,
    message: null,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Plus size={17} className="text-gold-600" /> Dodaj korisnika
        </h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Registracija je isključena — nalog može napraviti samo administrator.
        </p>

        {state.error && (
          <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}
        {state.message && (
          <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{state.message}</p>
        )}

        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="email" label="Email" type="email" required />
            <Field name="name" label="Ime (opcionalno)" />
            <SelectField name="role" label="Uloga" required options={ROLE_OPTIONS} defaultValue="support" />
            <Field name="password" label="Početna lozinka" type="password" required hint="Najmanje 10 znakova" />
          </div>
          <SubmitButton>Dodaj korisnika</SubmitButton>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">Korisnici ({users.length})</h2>

        <ul className="space-y-3">
          {users.map((user) => {
            const Icon = ROLE_ICON[user.role];
            const isSelf = user.email.toLowerCase() === currentEmail.toLowerCase();

            return (
              <li key={user.email} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{user.name || user.email}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLE[user.role]}`}>
                        <Icon size={11} /> {ROLE_LABEL[user.role]}
                      </span>
                      {isSelf && (
                        <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">Vi</span>
                      )}
                    </div>
                    {user.name && <p className="mt-0.5 text-sm text-slate-600">{user.email}</p>}
                    <p className="mt-1 text-xs text-slate-500">
                      Dodan {formatDate(user.created_at)}
                      {!user.canSignIn && ' · nalog za prijavu ne postoji'}
                    </p>
                  </div>

                  <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                    {isSelf ? (
                      <p className="text-xs text-slate-500 sm:text-right">
                        Ne možete mijenjati vlastitu ulogu
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-1.5 sm:justify-end">
                          {(['user', 'support', 'admin'] as Role[])
                            .filter((role) => role !== user.role)
                            .map((role) => (
                              <form key={role} action={setUserRole.bind(null, user.email, role)}>
                                <button
                                  type="submit"
                                  className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 transition hover:bg-slate-100"
                                >
                                  → {ROLE_LABEL[role]}
                                </button>
                              </form>
                            ))}
                        </div>
                        <DeleteButton
                          action={deleteUser.bind(null, user.email)}
                          label="Ukloni"
                          confirmLabel="Sigurno ukloni"
                        />
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <h3 className="mb-2 font-semibold text-slate-900">Šta koja uloga može</h3>
        <ul className="space-y-1.5">
          <li><strong className="text-slate-800">Administrator</strong> — sve: nekretnine, projekti, ture, statistika, korisnici.</li>
          <li><strong className="text-slate-800">Podrška</strong> — samo upiti i rezervacije: odgovaranje kupcima, mijenjanje statusa, otkazivanje i blokiranje termina.</li>
          <li><strong className="text-slate-800">Bez pristupa</strong> — može se prijaviti, ali ne vidi ništa. Za naloge koje tek pripremate.</li>
        </ul>
      </section>
    </div>
  );
}
