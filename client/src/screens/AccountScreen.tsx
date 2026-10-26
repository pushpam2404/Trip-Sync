import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import type { UserProfile, Vehicle } from '../types';
import { Notice } from '../components/ui/Notice';
import { Plate } from '../components/ui/Plate';
import { ArrowLeftIcon, CarIcon, BikeIcon, TrashIcon, PlusIcon, SunIcon, MoonIcon, LogoutIcon } from '../components/ui/icons';

type Kind = 'twoWheelers' | 'fourWheelers';
type Draft = Pick<UserProfile, 'name' | 'twoWheelers' | 'fourWheelers'>;

const KINDS: { key: Kind; label: string; icon: typeof CarIcon }[] = [
  { key: 'fourWheelers', label: 'Cars', icon: CarIcon },
  { key: 'twoWheelers', label: 'Bikes and scooters', icon: BikeIcon },
];

export default function AccountScreen() {
  const { user, saveProfile, handleLogout } = useAuth();
  const { theme, setTheme } = useUI();

  const [draft, setDraft] = useState<Draft>(() => ({
    name: user?.name ?? '',
    twoWheelers: user?.twoWheelers.map((v) => ({ ...v })) ?? [],
    fourWheelers: user?.fourWheelers.map((v) => ({ ...v })) ?? [],
  }));
  const [newKind, setNewKind] = useState<Kind>('fourWheelers');
  const [newReg, setNewReg] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  if (!user) return null;

  const dirty = JSON.stringify(draft) !== JSON.stringify({ name: user.name, twoWheelers: user.twoWheelers, fourWheelers: user.fourWheelers });

  const edit = (next: Partial<Draft>) => {
    setStatus(null);
    setDraft((d) => ({ ...d, ...next }));
  };

  const addVehicle = (event: FormEvent) => {
    event.preventDefault();
    const regNumber = newReg.trim().toUpperCase();
    if (!regNumber) return;
    const vehicle: Vehicle = { id: `${newKind === 'twoWheelers' ? 'tw' : 'fw'}-${Date.now()}`, regNumber };
    edit({ [newKind]: [...draft[newKind], vehicle] });
    setNewReg('');
  };

  const save = async () => {
    const name = draft.name.trim();
    if (name.length < 2 || !/^[a-zA-Z\s]+$/.test(name)) {
      setStatus({ ok: false, text: 'Use at least 2 letters for your name. Numbers and symbols are not allowed.' });
      return;
    }
    if ([...draft.twoWheelers, ...draft.fourWheelers].some((v) => !v.regNumber.trim())) {
      setStatus({ ok: false, text: 'Fill in every registration number, or remove the empty ones.' });
      return;
    }
    setSaving(true);
    const result = await saveProfile({ ...draft, name });
    setSaving(false);
    setStatus(result.success ? { ok: true, text: 'Saved.' } : { ok: false, text: result.message ?? 'Could not save your changes.' });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pt-safe border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-2 py-2 sm:px-6">
          <Link to="/" className="icon-btn" aria-label="Back to home">
            <ArrowLeftIcon className="size-5" />
          </Link>
          <h1 className="t-heading text-xl">Account</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-10 px-4 pb-8 pt-8 sm:px-8">
        <section aria-labelledby="acc-profile" className="space-y-4">
          <h2 id="acc-profile" className="t-heading">Profile</h2>
          <div>
            <label htmlFor="acc-name" className="field-label">Full name</label>
            <input id="acc-name" className="input" value={draft.name} onChange={(e) => edit({ name: e.target.value })} autoComplete="name" maxLength={50} />
          </div>
          <div>
            <p className="field-label">Phone</p>
            <p className="tnum text-ink-soft">{user.phone}</p>
            <p className="field-hint">Your phone number is your login, so it cannot be changed here.</p>
          </div>
        </section>

        <section aria-labelledby="acc-theme" className="space-y-3">
          <h2 id="acc-theme" className="t-heading">Appearance</h2>
          <div className="segmented max-w-xs">
            <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
              <span className="inline-flex items-center justify-center gap-2"><SunIcon className="size-4" aria-hidden="true" />Light</span>
            </button>
            <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
              <span className="inline-flex items-center justify-center gap-2"><MoonIcon className="size-4" aria-hidden="true" />Dark</span>
            </button>
          </div>
        </section>

        <section aria-labelledby="acc-vehicles" className="space-y-6">
          <h2 id="acc-vehicles" className="t-heading">Vehicles</h2>
          {KINDS.map(({ key, label, icon: Icon }) => (
            <div key={key}>
              <h3 className="mb-1 flex items-center gap-2 font-semibold text-ink-soft">
                <Icon className="size-4" aria-hidden="true" />
                {label} ({draft[key].length})
              </h3>
              {draft[key].length === 0 ? (
                <p className="py-2 text-ink-muted">None added.</p>
              ) : (
                <ul className="rows">
                  {draft[key].map((v) => (
                    <li key={v.id} className="flex items-center gap-2 py-2">
                      <input
                        className="input flex-1 font-semibold uppercase tracking-wide"
                        value={v.regNumber}
                        onChange={(e) => edit({ [key]: draft[key].map((x) => (x.id === v.id ? { ...x, regNumber: e.target.value.toUpperCase() } : x)) })}
                        aria-label={`Registration number, ${label.toLowerCase()}`}
                        maxLength={20}
                      />
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        onClick={() => edit({ [key]: draft[key].filter((x) => x.id !== v.id) })}
                        aria-label={`Remove ${v.regNumber || 'vehicle'}`}
                      >
                        <TrashIcon className="size-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <form onSubmit={addVehicle} className="space-y-3 rounded-[var(--radius-control)] border border-line bg-surface p-4">
            <p className="font-semibold">Add a vehicle</p>
            <div className="segmented" role="group" aria-label="Vehicle type">
              <button type="button" aria-pressed={newKind === 'fourWheelers'} onClick={() => setNewKind('fourWheelers')}>Car</button>
              <button type="button" aria-pressed={newKind === 'twoWheelers'} onClick={() => setNewKind('twoWheelers')}>Bike</button>
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1 uppercase"
                value={newReg}
                onChange={(e) => setNewReg(e.target.value.toUpperCase())}
                placeholder="MH 12 AB 1234"
                aria-label="New registration number"
                maxLength={20}
              />
              <button type="submit" className="btn btn-outline" disabled={!newReg.trim()}>
                <PlusIcon className="size-4" aria-hidden="true" />
                Add
              </button>
            </div>
            {newReg.trim() && <Plate reg={newReg.trim()} />}
          </form>
        </section>

        <section aria-labelledby="acc-session" className="border-t border-line pt-8">
          <h2 id="acc-session" className="t-heading mb-3">Session</h2>
          <button type="button" className="btn btn-danger" onClick={handleLogout}>
            <LogoutIcon className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </section>
      </main>

      <div className="pb-safe sticky bottom-0 border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 pt-3 sm:px-8">
          <p className={`min-w-0 flex-1 text-sm ${status && !status.ok ? 'text-danger' : 'text-ink-muted'}`} role="status">
            {status ? status.text : dirty ? 'You have unsaved changes.' : ''}
          </p>
          <button type="button" className="btn btn-primary" onClick={save} disabled={!dirty || saving}>
            {saving && <span className="spinner" aria-hidden="true" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
