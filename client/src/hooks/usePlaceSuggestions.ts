import { useEffect, useState } from 'react';
import { getAutocompletePredictions } from '../services/mapService';
import type { PlaceSuggestion } from '../types';

/**
 * Debounced autosuggest for a text field. Only the latest query can update the
 * list, so a slow response for "Pun" never overwrites the results for "Pune".
 */
export function usePlaceSuggestions(query: string, enabled: boolean, minLength = 3): PlaceSuggestion[] {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);

  useEffect(() => {
    const text = query.trim();
    if (!enabled || text.length < minLength) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const results = await getAutocompletePredictions(text);
      if (!cancelled) setSuggestions(results);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, enabled, minLength]);

  return suggestions;
}
