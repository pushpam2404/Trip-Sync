import { useCallback, useId, useState } from 'react';
import { usePlaceSuggestions } from '../../hooks/usePlaceSuggestions';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import type { PlaceSuggestion } from '../../types';
import { MicIcon } from './icons';
import { Notice } from './Notice';

interface PlaceInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: PlaceSuggestion) => void;
  placeholder?: string;
  hint?: string;
  /** Extra text appended to the query, e.g. " near Goa", to bias suggestions. */
  queryBias?: string;
  /** Skip suggestions while the field holds a placeholder value like "Current Location". */
  suppressFor?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

/** Text field with place suggestions and voice input, wired up as an ARIA combobox. */
export function PlaceInput({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  hint,
  queryBias = '',
  suppressFor,
  onFocus,
  onBlur,
}: PlaceInputProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  // Set once a suggestion is chosen; typing again brings the list back.
  const [dismissed, setDismissed] = useState(false);

  const suggestions = usePlaceSuggestions(value + queryBias, focused && !dismissed && value !== suppressFor);
  const speech = useSpeechToText(onChange);
  const open = focused && !dismissed && suggestions.length > 0;

  const choose = useCallback(
    (suggestion: PlaceSuggestion) => {
      onChange(suggestion.label);
      onSelect?.(suggestion);
      setActive(-1);
      setDismissed(true);
    },
    [onChange, onSelect],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === 'Escape') {
      setFocused(false);
    }
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="input-group">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setActive(-1);
            setDismissed(false);
          }}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className={`icon-btn rounded-l-none ${speech.isListening ? 'text-danger' : ''}`}
          onClick={speech.startListening}
          aria-label={speech.isListening ? `Stop voice input for ${label}` : `Speak ${label}`}
          aria-pressed={speech.isListening}
        >
          <MicIcon className="size-5" />
        </button>
      </div>
      {hint && !open && <p className="field-hint">{hint}</p>}

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-[var(--radius-field)] border border-line-strong bg-surface py-1 shadow-xl"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.placeId}-${i}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown fires before the input blurs, so the choice lands before the list unmounts
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              className={`cursor-pointer px-3.5 py-2.5 ${i === active ? 'bg-raised' : 'hover:bg-raised'}`}
            >
              <div className="font-semibold leading-snug">{s.name}</div>
              {s.address && <div className="text-sm text-ink-muted leading-snug">{s.address}</div>}
            </li>
          ))}
        </ul>
      )}

      {speech.error && (
        <div className="mt-2">
          <Notice>
            {speech.error} If you blocked the microphone, allow it from the site settings in your browser and tap the mic again.
          </Notice>
        </div>
      )}
    </div>
  );
}
