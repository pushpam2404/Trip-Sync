import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async (apiUrl: string) => {
  vi.resetModules();
  vi.stubEnv('VITE_API_URL', apiUrl);
  return import('./config');
};

afterEach(() => vi.unstubAllEnvs());

describe('config', () => {
  it('reports VITE_API_URL as missing when it is empty', async () => {
    const { config, missingConfig } = await load('');
    expect(config.apiUrl).toBe('');
    expect(missingConfig).toEqual(['VITE_API_URL']);
  });

  it('adds /api when the variable is just the server origin', async () => {
    expect((await load('https://api.example.com')).config.apiUrl).toBe('https://api.example.com/api');
    expect((await load('https://api.example.com/')).config.apiUrl).toBe('https://api.example.com/api');
  });

  it('keeps a value that already ends in /api', async () => {
    const { config, missingConfig } = await load('http://localhost:3001/api/');
    expect(config.apiUrl).toBe('http://localhost:3001/api');
    expect(missingConfig).toEqual([]);
  });
});
