import { useId, useState } from 'react';
import { FieldError } from './FieldError';

interface PhoneFieldProps {
  value: string;
  onChange: (digits: string) => void;
  /** Show the error even if the field was not touched, e.g. after a submit attempt. */
  showError?: boolean;
}

export function PhoneField({ value, onChange, showError = false }: PhoneFieldProps) {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const error = (touched || showError) && value.length !== 10 ? 'Enter a 10-digit mobile number.' : null;
  return (
    <div>
      <label htmlFor={id} className="field-label">Mobile number</label>
      <div className="input-group" style={error ? { borderColor: 'var(--danger)' } : undefined}>
        <span className="input-addon" aria-hidden="true">+91</span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          onBlur={() => setTouched(true)}
          placeholder="98765 43210"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
