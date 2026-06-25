import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  if (isToday(date)) return '今天';
  if (isTomorrow(date)) return '明天';
  return format(date, 'M月d日', { locale: zhCN });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  if (isToday(date)) return format(date, '今天 HH:mm', { locale: zhCN });
  if (isTomorrow(date)) return format(date, '明天 HH:mm', { locale: zhCN });
  return format(date, 'yyyy年M月d日 HH:mm', { locale: zhCN });
}

export function formatDateTimeShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  if (isToday(date)) return format(date, 'HH:mm', { locale: zhCN });
  if (isTomorrow(date)) return format(date, '明天 HH:mm', { locale: zhCN });
  return format(date, 'M/d HH:mm', { locale: zhCN });
}

export function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start && !end) return '';
  const startStr = formatDateTimeShort(start);
  const endStr = formatDateTimeShort(end);
  if (start && end) return `${startStr} - ${endStr}`;
  if (start) return `从 ${startStr} 开始`;
  return `截止 ${endStr}`;
}

export function isOverdue(dateStr: string | null | undefined, completed = false): boolean {
  if (!dateStr || completed) return false;
  const date = parseISO(dateStr);
  return isPast(date) && !isToday(date);
}

export function getOverdueDays(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const date = parseISO(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
