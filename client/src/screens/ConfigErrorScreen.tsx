import { Logo } from '../components/ui/Logo';

/** Shown instead of the app when a required build variable is missing. */
export default function ConfigErrorScreen({ missing }: { missing: string[] }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-6 py-10">
      <Logo />
      <div>
        <h1 className="t-title">TripSync is not configured</h1>
        <p className="mt-3 text-ink-soft">
          This build is missing {missing.length === 1 ? 'a required setting' : 'required settings'}, so it cannot reach its server.
        </p>
      </div>
      <ul className="rows rounded-[var(--radius-control)] border border-line-strong bg-surface px-4">
        {missing.map((name) => (
          <li key={name} className="py-3">
            <code className="font-semibold">{name}</code>
            <p className="t-meta">
              The base URL of the TripSync API, for example <code>https://your-api.onrender.com/api</code>.
            </p>
          </li>
        ))}
      </ul>
      <p className="text-ink-soft">
        Set it in <code>client/.env.local</code> for development, or in the Vercel project settings for production, then rebuild. The variable is read at build time.
      </p>
    </main>
  );
}
