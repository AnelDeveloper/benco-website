type EnvSource = Record<string, string | undefined>;

export function requireEnv(name: string, source: EnvSource = process.env): string {
  const value = source[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to .env.local (see .env.example).`,
    );
  }
  return value;
}

export function optionalEnv(name: string, source: EnvSource = process.env): string | null {
  const value = source[name];
  return value === undefined || value.trim() === '' ? null : value;
}
