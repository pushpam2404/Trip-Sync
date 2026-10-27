import { describe, expect, it } from 'vitest';
import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('formats ten digits as +91 XXXXXXXXXX', () => {
    expect(normalizePhone('9876543210')).toBe('+91 9876543210');
  });

  it('accepts a leading country code in common spellings', () => {
    expect(normalizePhone('+91 9876543210')).toBe('+91 9876543210');
    expect(normalizePhone('919876543210')).toBe('+91 9876543210');
    expect(normalizePhone('+91-98765-43210')).toBe('+91 9876543210');
  });

  it('leaves anything else alone so the server can reject it', () => {
    expect(normalizePhone('12345')).toBe('12345');
    expect(normalizePhone('')).toBe('');
  });
});
