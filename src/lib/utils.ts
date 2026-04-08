import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CENTRAL_TIMEZONE = 'America/Chicago';

export function formatCentralDeadline(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions
) {
  const date = value instanceof Date ? value : new Date(value);

  return `${date.toLocaleString('en-US', {
    timeZone: CENTRAL_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  })} (CT)`;
}
