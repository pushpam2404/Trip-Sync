/** Formats an Indian mobile number as "+91 XXXXXXXXXX". Other input is returned unchanged. */
export const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2)}`;
  return phone;
};
