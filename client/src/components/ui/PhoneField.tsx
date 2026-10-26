import { useId } from 'react';

export function PhoneField({ value, onChange }: { value: string; onChange: (digits: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="field-label">Mobile number</label>
      <div className="input-group">
        <span className="input-addon" aria-hidden="true">+91</span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="98765 43210"
        />
      </div>
    </div>
  );
}
