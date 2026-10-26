import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { PhoneField } from '../../components/ui/PhoneField';
import { PasswordField } from '../../components/ui/PasswordField';
import { Notice } from '../../components/ui/Notice';

export default function LoginScreen() {
  const { handleLogin, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const canSubmit = phone.length === 10 && password.length > 0 && !isLoading;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
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
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <Notice>{error}</Notice>}
        <PhoneField value={phone} onChange={setPhone} />
        <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <button type="submit" className="btn btn-primary btn-block" disabled={!canSubmit}>
          {isLoading ? <span className="spinner" aria-hidden="true" /> : null}
          {isLoading ? 'Signing in' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
