import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { errorMessage } from './api';

const httpError = (status: number, data: unknown) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, { status, data, statusText: '', headers: {}, config: {} as never });

describe('errorMessage', () => {
  it('uses the message the server sent', () => {
    expect(errorMessage(httpError(409, { message: 'An account with this phone number already exists' }), 'fallback')).toBe(
      'An account with this phone number already exists',
    );
  });

  it('falls back when the server sent no message', () => {
    expect(errorMessage(httpError(500, {}), 'Something went wrong')).toBe('Something went wrong');
  });

  it('explains a network failure that never got a response', () => {
    const offline = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(errorMessage(offline, 'fallback')).toMatch(/cannot reach the server/i);
  });

  it('falls back for errors that are not from axios', () => {
    expect(errorMessage(new Error('boom'), 'fallback')).toBe('fallback');
    expect(errorMessage(undefined, 'fallback')).toBe('fallback');
  });
});
