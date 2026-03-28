export type StatusVariant = 'solid' | 'subtle';

export interface StatusConfig {
  label: string;
  // Subtle pill (default) — tinted bg + border
  bg: string;
  text: string;
  border: string;
  dot: string;
  // Solid pill — for high-emphasis contexts (e.g. kanban column header)
  solidBg: string;
  solidText: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Job Card Statuses
  'Pending': {
    label: 'Pending',
    bg: 'bg-amber-100 dark:bg-amber-950',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-400 dark:border-amber-700',
    dot: 'bg-amber-500',
    solidBg: 'bg-amber-500 dark:bg-amber-600',
    solidText: 'text-white',
  },
  'In Progress': {
    label: 'In Progress',
    bg: 'bg-blue-100 dark:bg-blue-950',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-400 dark:border-blue-600',
    dot: 'bg-blue-500',
    solidBg: 'bg-blue-600 dark:bg-blue-500',
    solidText: 'text-white',
  },
  'QC Review': {
    label: 'QC Review',
    bg: 'bg-violet-100 dark:bg-violet-950',
    text: 'text-violet-800 dark:text-violet-300',
    border: 'border-violet-400 dark:border-violet-600',
    dot: 'bg-violet-500',
    solidBg: 'bg-violet-600 dark:bg-violet-500',
    solidText: 'text-white',
  },
  'Ready': {
    label: 'Ready',
    bg: 'bg-emerald-100 dark:bg-emerald-950',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-400 dark:border-emerald-600',
    dot: 'bg-emerald-500',
    solidBg: 'bg-emerald-600 dark:bg-emerald-500',
    solidText: 'text-white',
  },
  'Rework': {
    label: 'Rework',
    bg: 'bg-orange-100 dark:bg-orange-950',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-400 dark:border-orange-700',
    dot: 'bg-orange-500',
    solidBg: 'bg-orange-500 dark:bg-orange-600',
    solidText: 'text-white',
  },
  'Delivered': {
    label: 'Delivered',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-400 dark:border-zinc-600',
    dot: 'bg-zinc-500',
    solidBg: 'bg-zinc-600 dark:bg-zinc-500',
    solidText: 'text-white',
  },
  'Cancelled': {
    label: 'Cancelled',
    bg: 'bg-red-100 dark:bg-red-950',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-400 dark:border-red-700',
    dot: 'bg-red-500',
    solidBg: 'bg-red-600 dark:bg-red-500',
    solidText: 'text-white',
  },

  // QC Statuses
  'PASS': {
    label: 'PASS',
    bg: 'bg-emerald-100 dark:bg-emerald-950',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-400 dark:border-emerald-600',
    dot: 'bg-emerald-500',
    solidBg: 'bg-emerald-600 dark:bg-emerald-500',
    solidText: 'text-white',
  },
  'FAIL': {
    label: 'FAIL',
    bg: 'bg-rose-100 dark:bg-rose-950',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-400 dark:border-rose-700',
    dot: 'bg-rose-500',
    solidBg: 'bg-rose-600 dark:bg-rose-500',
    solidText: 'text-white',
  },

  // Item / Task Statuses
  'Completed': {
    label: 'Completed',
    bg: 'bg-emerald-100 dark:bg-emerald-950',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-400 dark:border-emerald-600',
    dot: 'bg-emerald-400',
    solidBg: 'bg-emerald-500 dark:bg-emerald-500',
    solidText: 'text-white',
  },
  'On Hold': {
    label: 'On Hold',
    bg: 'bg-amber-100 dark:bg-amber-950',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-400 dark:border-amber-700',
    dot: 'bg-amber-500',
    solidBg: 'bg-amber-500 dark:bg-amber-600',
    solidText: 'text-white',
  },
  'Default': {
    label: 'Unknown',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-300 dark:border-zinc-600',
    dot: 'bg-zinc-400',
    solidBg: 'bg-zinc-500',
    solidText: 'text-white',
  },
};

export const getStatusConfig = (status: string): StatusConfig =>
  STATUS_CONFIG[status] ?? STATUS_CONFIG['Default'];

export const JOB_CARD_STATUS_KEYS = [
  'Pending',
  'In Progress',
  'QC Review',
  'Rework',
  'Ready',
  'Delivered',
  'Cancelled'
];