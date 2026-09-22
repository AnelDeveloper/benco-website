'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Lock } from 'lucide-react';
import { signIn, type SignInState } from '../_actions/auth';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-gold-600 px-4 py-3 font-semibold text-white transition hover:bg-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Prijava u toku…' : 'Prijavi se'}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<SignInState, FormData>(signIn, { error: null });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-600">
            <Lock size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Ben&amp;Co Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Prijavite se za upravljanje sadržajem</p>
        </div>

        <form action={formAction} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          {state.error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Lozinka
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
            />
          </div>

          <SubmitButton />
        </form>
      </div>
    </main>
  );
}
