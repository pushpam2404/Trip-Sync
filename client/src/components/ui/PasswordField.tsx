import { useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';
import { FieldError } from './FieldError';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  placeholder?: string;
  describedBy?: string;
  error?: string | null;
}

export function PasswordField({ label, value, onChange, autoComplete, placeholder, describedBy, error }: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="input-group" style={error ? { borderColor: 'var(--danger)' } : undefined}>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={[describedBy, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined}
        />
        <button
          type="button"
          className="icon-btn rounded-l-none"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
        </button>
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
