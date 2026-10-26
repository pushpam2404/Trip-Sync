import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useUI } from '../../contexts/UIContext';
import type { TravelMode, UserProfile, Vehicle } from '../../types';
import { Sheet } from '../ui/Sheet';
import { Plate } from '../ui/Plate';
import { Notice } from '../ui/Notice';
import { CarIcon, BikeIcon, TrainIcon, WalkIcon, EditIcon, CheckIcon, CloseIcon, ArrowLeftIcon } from '../ui/icons';

const MODES: { mode: TravelMode; label: string; icon: typeof CarIcon }[] = [
  { mode: '4W', label: 'Car', icon: CarIcon },
  { mode: '2W', label: 'Bike', icon: BikeIcon },
  { mode: 'train', label: 'Train', icon: TrainIcon },
  { mode: 'walking', label: 'Walk', icon: WalkIcon },
];

/**
 * The two sheets that sit between "I want to go there" and the map:
 * pick how you are travelling, then (for cars and bikes) which vehicle and how many people.
 */
export function TripSetupSheets() {
  const { activeModal, setActiveModal } = useUI();
  const { origin, destination, startNavigation } = useNavigation();
  const { user, saveProfile } = useAuth();

  const [mode, setMode] = useState<TravelMode | null>(null);
  const [selected, setSelected] = useState<string>('other'); // vehicle id or 'other'
  const [otherReg, setOtherReg] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const listKey = mode === '2W' ? 'twoWheelers' : 'fourWheelers';
  const vehicles: Vehicle[] = user?.[listKey] ?? [];

  const close = () => {
    setActiveModal(null);
    setMode(null);
    setSelected('other');
    setOtherReg('');
    setTravelers(1);
    setEditingId(null);
    setError(null);
  };

  const pickMode = (next: TravelMode) => {
    if (next === '2W' || next === '4W') {
      const first = (next === '2W' ? user?.twoWheelers : user?.fourWheelers)?.[0];
      setMode(next);
      setSelected(first?.id ?? 'other');
      setActiveModal('vehicleSelection');
      return;
    }
    startNavigation({ from: origin, to: destination, mode: next, travelers: 1 });
    close();
  };

  const confirm = () => {
    if (!mode) return;
    const chosen = vehicles.find((v) => v.id === selected);
    const vehicleNumber = chosen ? chosen.regNumber : otherReg.trim().toUpperCase() || undefined;
    startNavigation({ from: origin, to: destination, mode, travelers, vehicleNumber });
    close();
  };

  const saveEdit = async () => {
    if (!user || !editingId) return;
    const reg = editDraft.trim().toUpperCase();
    if (!reg) return;
    const next: Pick<UserProfile, 'name' | 'twoWheelers' | 'fourWheelers'> = {
      name: user.name,
      twoWheelers: user.twoWheelers,
      fourWheelers: user.fourWheelers,
    };
    next[listKey] = user[listKey].map((v) => (v.id === editingId ? { ...v, regNumber: reg } : v));
    const result = await saveProfile(next);
    if (result.success) {
      setEditingId(null);
      setError(null);
    } else {
      setError(result.message ?? 'Could not save the vehicle.');
    }
  };

  return (
    <>
      <Sheet open={activeModal === 'travelMode'} onClose={close} title="How are you travelling?">
        <p className="mb-4 text-ink-soft">
          {origin} to {destination}
        </p>
        <div className="grid grid-cols-2 gap-3 pb-1">
          {MODES.map(({ mode: value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => pickMode(value)}
              className="flex min-h-24 flex-col items-start justify-between rounded-[var(--radius-control)] border-[1.5px] border-line-strong p-4 text-left transition-colors hover:bg-raised"
            >
              <Icon className="size-6" aria-hidden="true" />
              <span className="font-display text-lg font-bold">{label}</span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={activeModal === 'vehicleSelection'} onClose={close} title={mode === '2W' ? 'Which bike?' : 'Which car?'}>
        <div className="space-y-5 pb-1">
          <fieldset>
            <legend className="sr-only">Vehicle</legend>
            <div className="rows">
              {vehicles.map((v) => (
                <div key={v.id} className="flex min-h-14 items-center gap-3 py-1">
                  {editingId === v.id ? (
                    <>
                      <input
                        className="input flex-1 uppercase"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value.toUpperCase())}
                        aria-label="Registration number"
                        autoFocus
                      />
                      <button type="button" className="icon-btn" onClick={saveEdit} aria-label="Save registration number">
                        <CheckIcon className="size-5" />
                      </button>
                      <button type="button" className="icon-btn" onClick={() => setEditingId(null)} aria-label="Cancel editing">
                        <CloseIcon className="size-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
                        <input
                          type="radio"
                          name="vehicle"
                          className="size-5 accent-[var(--accent)]"
                          checked={selected === v.id}
                          onChange={() => setSelected(v.id)}
                        />
                        <Plate reg={v.regNumber} />
                      </label>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Edit ${v.regNumber}`}
                        onClick={() => {
                          setEditingId(v.id);
                          setEditDraft(v.regNumber);
                        }}
                      >
                        <EditIcon className="size-5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
              <div className="py-1">
                <label className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="vehicle"
                    className="size-5 accent-[var(--accent)]"
                    checked={selected === 'other'}
                    onChange={() => setSelected('other')}
                  />
                  <span className="font-semibold">{vehicles.length ? 'A different vehicle' : 'Vehicle number'}</span>
                </label>
                {selected === 'other' && (
                  <input
                    className="input mt-2 uppercase"
                    value={otherReg}
                    onChange={(e) => setOtherReg(e.target.value.toUpperCase())}
                    placeholder="MH 12 AB 1234"
                    aria-label="Registration number"
                  />
                )}
              </div>
            </div>
          </fieldset>

          {error && <Notice>{error}</Notice>}

          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold" id="travelers-label">Travellers</span>
            <div className="flex items-center gap-1" role="group" aria-labelledby="travelers-label">
              <button
                type="button"
                className="btn btn-outline size-11 p-0! text-xl"
                onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                disabled={travelers <= 1}
                aria-label="Fewer travellers"
              >
                &minus;
              </button>
              <output className="tnum w-10 text-center font-display text-xl font-bold" aria-live="polite">{travelers}</output>
              <button
                type="button"
                className="btn btn-outline size-11 p-0! text-xl"
                onClick={() => setTravelers((t) => Math.min(20, t + 1))}
                aria-label="More travellers"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" className="btn btn-outline" onClick={() => setActiveModal('travelMode')}>
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              Back
            </button>
            <button type="button" className="btn btn-primary flex-1" onClick={confirm}>
              Start navigation
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
