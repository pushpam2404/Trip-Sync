import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { CarIcon, BikeIcon } from '../../components/ui/icons';

function Counter({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: typeof CarIcon;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 py-2">
      <span className="flex items-center gap-3 font-semibold">
        <Icon className="size-5 text-ink-soft" aria-hidden="true" />
        {label}
      </span>
      <div className="flex items-center gap-1" role="group" aria-label={label}>
        <button type="button" className="btn btn-outline size-11 p-0! text-xl" onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0} aria-label={`Fewer ${label.toLowerCase()}`}>
          &minus;
        </button>
        <output className="tnum w-10 text-center font-display text-xl font-bold" aria-live="polite">{value}</output>
        <button type="button" className="btn btn-outline size-11 p-0! text-xl" onClick={() => onChange(Math.min(10, value + 1))} aria-label={`More ${label.toLowerCase()}`}>
          +
        </button>
      </div>
    </div>
  );
}

export default function ProfileSetup1Screen() {
  const { startProfileSetup, hasPendingSignup } = useAuth();
  const [name, setName] = useState('');
  const [twoWheelers, setTwoWheelers] = useState(0);
  const [fourWheelers, setFourWheelers] = useState(0);

  // Reloading in the middle of sign-up clears the password from memory, so start over.
  if (!hasPendingSignup) return <Navigate to="/signup" replace />;

  const trimmed = name.trim();
  const canContinue = trimmed.length >= 2;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canContinue) startProfileSetup({ name: trimmed, numTwoWheelers: twoWheelers, numFourWheelers: fourWheelers });
  };

  return (
    <AuthLayout
      title="Tell us about you"
      subtitle="Your name and the vehicles you drive. You can change both later."
      back={{ to: '/signup', label: 'Back' }}
      art={false}
      step={{ current: 2, total: 3 }}
    >
      <form onSubmit={submit} className="space-y-6" noValidate>
        <div>
          <label htmlFor="name" className="field-label">Full name</label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
            autoComplete="name"
            maxLength={50}
            placeholder="Asha Rao"
          />
        </div>
        <fieldset>
          <legend className="field-label">How many vehicles do you own?</legend>
          <div className="rows">
            <Counter label="Bikes and scooters" icon={BikeIcon} value={twoWheelers} onChange={setTwoWheelers} />
            <Counter label="Cars" icon={CarIcon} value={fourWheelers} onChange={setFourWheelers} />
          </div>
        </fieldset>
        <button type="submit" className="btn btn-primary btn-block" disabled={!canContinue}>
          Continue
        </button>
      </form>
    </AuthLayout>
  );
}
