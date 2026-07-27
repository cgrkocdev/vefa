export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+90${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 10) return `+90${digits}`;
  return value;
}

export function formatPhone(value: string) {
  const normalized = normalizePhone(value);
  const match = normalized.match(/^\+90(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return match ? `0${match[1]} ${match[2]} ${match[3]} ${match[4]}` : value;
}
