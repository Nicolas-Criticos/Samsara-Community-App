export const ANIMAL_TYPES = {
  sheep: {
    label: 'Sheep',
    icon: '🐑',
    categories: ['ram', 'ewe', 'lamb'],
  },
  cattle: {
    label: 'Cattle',
    icon: '🐄',
    categories: ['bull', 'cow', 'calf'],
  },
};

export const PRODUCE_CATEGORIES = [
  { key: 'olive_oil', label: 'Olive Oil', icon: '🫒' },
  { key: 'olives', label: 'Olives', icon: '🫒' },
  { key: 'meat', label: 'Meat', icon: '🥩' },
  { key: 'other', label: 'Other', icon: '📦' },
];

export const EXPENSE_CATEGORIES = [
  'olive_oil',
  'olives',
  'meat',
  'accommodation',
  'staff',
  'general',
];

export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const MONTH_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

export const VG_COLORS = {
  bg: '#f6f3ee',
  text: '#2b2b2b',
  muted: 'rgba(75,71,65,0.6)',
  gold: '#c2a66d',
  olive: '#6b7f5e',
  border: 'rgba(122,112,94,0.2)',
  card: 'rgba(255,252,247,0.95)',
};

// Chart line colors for history/graphs
export const CHART_COLORS = {
  revenue: '#6b7f5e',
  costs: '#c2a66d',
  profit: '#2b2b2b',
  sheep: '#8b6f47',
  cattle: '#5a7a5a',
  olive_oil: '#6b7f5e',
  olives: '#8b8b3a',
  meat: '#8b4a4a',
  accommodation: '#4a6b8b',
  staff: '#7a5a8b',
};
