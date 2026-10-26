import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { PhoneField } from '../../components/ui/PhoneField';
import { PasswordField } from '../../components/ui/PasswordField';
import { CheckIcon, DotIcon } from '../../components/ui/icons';

const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'A number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'A special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function SignUpScreen() {
  const { handleSignup } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const allMet = RULES.every((rule) => rule.test(password));
  const canSubmit = phone.length === 10 && allMet;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit) handleSignup(phone, password);
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Your phone number is your login. Next you will add your name and vehicles."
      back={{ to: '/login', label: 'Back to sign in' }}
      step={{ current: 1, total: 3 }}
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <PhoneField value={phone} onChange={setPhone} />
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="Create a password"
          describedBy="password-rules"
        />
        <ul id="password-rules" className="grid gap-1.5 sm:grid-cols-2" aria-label="Password requirements">
          {RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li key={rule.label} className={`flex items-center gap-2 text-sm ${met ? 'text-route-ink' : 'text-ink-muted'}`}>
                {met ? <CheckIcon className="size-4" aria-hidden="true" /> : <DotIcon className="size-3 mx-0.5" aria-hidden="true" />}
                {rule.label}
                <span className="sr-only">{met ? ', done' : ', still needed'}</span>
              </li>
            );
          })}
        </ul>
        <button type="submit" className="btn btn-primary btn-block" disabled={!canSubmit}>
          Continue
        </button>
      </form>
    </AuthLayout>
  );
}
