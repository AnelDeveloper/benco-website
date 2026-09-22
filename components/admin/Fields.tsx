'use client';

import { useFormStatus } from 'react-dom';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 disabled:bg-slate-50';

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

type BaseProps = {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

export function Field({
  name,
  label,
  error,
  hint,
  required,
  type = 'text',
  defaultValue,
  step,
  min,
  max,
}: BaseProps & {
  type?: string;
  defaultValue?: string | number | null;
  step?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        defaultValue={defaultValue ?? ''}
        className={inputClass}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

export function TextareaField({
  name,
  label,
  error,
  defaultValue,
  rows = 4,
}: BaseProps & { defaultValue?: string | null; rows?: number }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ''}
        className={inputClass}
      />
      <FieldError message={error} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  error,
  options,
  defaultValue,
  required,
}: BaseProps & { options: { value: string; label: string }[]; defaultValue?: string | null }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select id={name} name={name} defaultValue={defaultValue ?? ''} className={inputClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gold-600 focus:ring-gold-500"
      />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

export function SubmitButton({ children = 'Sačuvaj' }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gold-600 px-5 py-2.5 font-semibold text-white transition hover:bg-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Čuvanje…' : children}
    </button>
  );
}
