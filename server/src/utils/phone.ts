/**
 * Phones are stored as "+91 XXXXXXXXXX". The client sends that form already, but
 * the API also accepts a bare 10 digit number so the same person cannot end up
 * with two accounts. Returns null when the input is not an Indian mobile number.
 */
export const normalizePhone = (input: unknown): string | null => {
    if (typeof input !== 'string') return null;
    const digits = input.replace(/\D/g, '');
    const national = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
    return /^\d{10}$/.test(national) ? `+91 ${national}` : null;
};
