import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Notice } from '../../components/ui/Notice';

function PlateInputs({
  title,
  values,
  onChange,
}: {
  title: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  if (values.length === 0) return null;
  return (
    <fieldset className="space-y-3">
      <legend className="field-label">{title}</legend>
      {values.map((value, i) => (
        <input
          key={i}
          className="input uppercase"
          value={value}
          onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value.toUpperCase() : v)))}
          placeholder="MH 12 AB 1234"
          aria-label={`${title}, vehicle ${i + 1} registration number`}
          maxLength={20}
        />
      ))}
    </fieldset>
  );
}

export default function ProfileSetup2Screen() {
  const { profileSetupData, hasPendingSignup, completeProfileSetup, isLoading } = useAuth();
  const [twoWheelers, setTwoWheelers] = useState<string[]>(() => Array(profileSetupData?.numTwoWheelers ?? 0).fill(''));
  const [fourWheelers, setFourWheelers] = useState<string[]>(() => Array(profileSetupData?.numFourWheelers ?? 0).fill(''));
  const [error, setError] = useState('');

  if (!profileSetupData || !hasPendingSignup) return <Navigate to="/signup" replace />;

  const hasVehicles = twoWheelers.length + fourWheelers.length > 0;
  const allFilled = [...twoWheelers, ...fourWheelers].every((reg) => reg.trim() !== '');

  const finish = async (vehicles: { twoWheelers: string[]; fourWheelers: string[] }) => {
    setError('');
    const result = await completeProfileSetup(vehicles);
    if (!result.success) setError(result.message ?? 'Could not create your account.');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (allFilled && !isLoading) finish({ twoWheelers, fourWheelers });
  };

  return (
    <AuthLayout
      title={hasVehicles ? 'Add your registration numbers' : 'You are all set'}
      subtitle={
        hasVehicles
          ? 'They appear in trip history and are offered when you start a trip.'
          : 'You did not add any vehicles. You can add them later from your account.'
      }
      back={{ to: '/profile/setup-1', label: 'Back' }}
      art={false}
      step={{ current: 3, total: 3 }}
    >
      <form onSubmit={submit} className="space-y-6" noValidate>
        {error && <Notice>{error}</Notice>}
        <PlateInputs title="Bikes and scooters" values={twoWheelers} onChange={setTwoWheelers} />
        <PlateInputs title="Cars" values={fourWheelers} onChange={setFourWheelers} />
        <div className="space-y-3">
          <button type="submit" className="btn btn-primary btn-block" disabled={!allFilled || isLoading}>
            {isLoading && <span className="spinner" aria-hidden="true" />}
            {isLoading ? 'Creating account' : 'Create account'}
          </button>
          {hasVehicles && (
            <button
              type="button"
              className="btn btn-quiet btn-block"
              disabled={isLoading}
              onClick={() => finish({ twoWheelers: [], fourWheelers: [] })}
            >
              Skip for now
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
