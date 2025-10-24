import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple toast notification utility
export const toast = {
  success: (message: string) => {
    console.log('[SUCCESS]', message);
    // You can implement a proper toast UI later
    alert(`✓ ${message}`);
  },
  error: (message: string) => {
    console.error('[ERROR]', message);
    alert(`✗ ${message}`);
  },
  info: (message: string) => {
    console.log('[INFO]', message);
    alert(`ℹ ${message}`);
  },
};

