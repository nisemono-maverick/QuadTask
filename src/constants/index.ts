import type { Priority, Quadrant } from '../types';

export const PRESET_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

export const QUADRANT_CONFIG: Record<Quadrant, {
  label: string;
  subtitle: string;
  bg: string;
  border: string;
  text: string;
  suggestedUrgency: number;
  suggestedImportance: number;
}> = {
  Q1: {
    label: 'Q1',
    subtitle: '紧急 · 重要',
    bg: 'bg-q1-bg',
    border: 'border-q1-border',
    text: 'text-q1-border',
    suggestedUrgency: 8,
    suggestedImportance: 9,
  },
  Q2: {
    label: 'Q2',
    subtitle: '不紧急 · 重要',
    bg: 'bg-q2-bg',
    border: 'border-q2-border',
    text: 'text-q2-border',
    suggestedUrgency: 2,
    suggestedImportance: 9,
  },
  Q3: {
    label: 'Q3',
    subtitle: '紧急 · 不重要',
    bg: 'bg-q3-bg',
    border: 'border-q3-border',
    text: 'text-q3-border',
    suggestedUrgency: 8,
    suggestedImportance: 2,
  },
  Q4: {
    label: 'Q4',
    subtitle: '不紧急 · 不重要',
    bg: 'bg-q4-bg',
    border: 'border-q4-border',
    text: 'text-q4-border',
    suggestedUrgency: 2,
    suggestedImportance: 2,
  },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  high: { label: '高', color: '#EF4444' },
  medium: { label: '中', color: '#F59E0B' },
  low: { label: '低', color: '#3B82F6' },
  none: { label: '无', color: '#9CA3AF' },
};

export const ICON_NAMES = [
  'List',
  'Briefcase',
  'User',
  'BookOpen',
  'Heart',
  'Star',
  'ShoppingCart',
  'Plane',
  'Home',
  'Music',
  'Camera',
  'Coffee',
];
