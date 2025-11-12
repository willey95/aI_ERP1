import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Korean currency (억원)
 */
export function formatCurrency(amount: number): string {
  const billion = amount / 100000000;
  if (billion >= 1000) {
    return `₩${(billion / 1000).toFixed(1)}조`;
  }
  if (billion >= 1) {
    return `₩${billion.toFixed(1)}억`;
  }
  const million = amount / 10000;
  if (million >= 1) {
    return `₩${million.toFixed(0)}만`;
  }
  return `₩${amount.toLocaleString()}`;
}

/**
 * Format number as percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get execution rate color based on percentage
 */
export function getExecutionRateColor(rate: number): string {
  if (rate >= 100) return 'execution-over';
  if (rate >= 90) return 'execution-critical';
  if (rate >= 75) return 'execution-high';
  if (rate >= 50) return 'execution-medium';
  return 'execution-low';
}

/**
 * Get execution rate badge class
 */
export function getExecutionRateBadgeClass(rate: number): string {
  if (rate >= 100) return 'bg-red-900 text-white';
  if (rate >= 90) return 'bg-red-500 text-white';
  if (rate >= 75) return 'bg-orange-500 text-white';
  if (rate >= 50) return 'bg-yellow-500 text-white';
  return 'bg-green-500 text-white';
}

/**
 * Get risk badge color
 */
export function getRiskBadgeColor(score: number): string {
  if (score >= 80) return 'bg-danger text-danger-foreground';
  if (score >= 60) return 'bg-warning text-warning-foreground';
  if (score >= 40) return 'bg-yellow-500 text-white';
  return 'bg-success text-success-foreground';
}

/**
 * Format date as Korean locale
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date as short format
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate days between two dates
 */
export function daysBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  const diff = endDate.getTime() - startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}
