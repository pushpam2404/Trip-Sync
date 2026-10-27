/**
 * Build-time configuration, read once from Vite env variables.
 * VITE_API_URL is required: without it the app shows a configuration screen
 * instead of guessing a server.
 */
const clean = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeApiUrl = (raw: string): string => {
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const rawApiUrl = clean(import.meta.env.VITE_API_URL);

export const config = {
  /** Base URL of the TripSync API, always ending in /api. Empty when not configured. */
  apiUrl: rawApiUrl ? normalizeApiUrl(rawApiUrl) : '',
  mapSdkKey: clean(import.meta.env.VITE_MAPPLS_MAP_SDK_KEY),
  restKey: clean(import.meta.env.VITE_MAPPLS_REST_API_KEY),
};

/** Names of required variables that are not set. */
export const missingConfig: string[] = config.apiUrl ? [] : ['VITE_API_URL'];
