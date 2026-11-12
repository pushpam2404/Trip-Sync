import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { PhoneField } from '../../components/ui/PhoneField';
import { PasswordField } from '../../components/ui/PasswordField';
import { Notice } from '../../components/ui/Notice';

// Demo travellers created by server/src/scripts/seed-demo.ts. They are public on
// purpose (listed in the README) so anyone can look around without signing up.
const DEMO_PASSWORD = 'Demo@1234';
const DEMO_ACCOUNTS = [
  { phone: '9000000001', name: 'Aarav Mehta', rides: 'Car and scooter, Pune and Mumbai' },
  { phone: '9000000002', name: 'Diya Rao', rides: 'Motorcycle, Bengaluru and Coorg' },
  { phone: '9000000003', name: 'Kabir Singh', rides: 'Car, Delhi to Rajasthan' },
];

export default function LoginScreen() {
  const { handleLogin, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);

    const tryDemo = async (demoPhone: string) => {
    setError('');
    const result = await handleLogin(demoPhone, DEMO_PASSWORD);
    if (!result.success) setError(result.message ?? 'The demo account could not sign in. Please try again.');
  };

  const canSubmit = phone.length === 10 && password.length > 0 && !isLoading;
  const passwordError = attempted && password.length === 0 ? 'Enter your password.' : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (!canSubmit) return;
    setError('');
    const result = await handleLogin(phone, password);
    if (!result.success) setError(result.message ?? 'Login failed. Please try again.');
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see your trips, saved routes and vehicles."
      footer={
        <p>
          New to TripSync?{' '}
          <Link to="/signup" className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4">
            Create an account
          </Link>
        </p>
      }
    >
      <section aria-labelledby="demo-heading" className="mb-6 border-b border-line pb-6">
        <h2 id="demo-heading" className="t-heading">Try a demo account</h2>
        <p className="mt-1 text-sm text-ink-soft">One tap signs you in. The trips and vehicles are made up.</p>
        <ul className="mt-3 grid gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.phone}>
              <button
                type="button"
                onClick={() => tryDemo(a.phone)}
                disabled={isLoading}
                className="flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-control)] border border-line bg-surface px-4 text-left transition-colors hover:border-ink-soft disabled:opacity-60"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-semibold text-bg" aria-hidden="true">
                  {a.name.split(' ').map((w) => w[0]).join('')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-tight">{a.name}</span>
                  <span className="block text-sm text-ink-soft">{a.rides}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <Notice>{error}</Notice>}
        <PhoneField value={phone} onChange={setPhone} showError={attempted} />
        <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" error={passwordError} />
        <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
          {isLoading ? <span className="spinner" aria-hidden="true" /> : null}
          {isLoading ? 'Signing in' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
