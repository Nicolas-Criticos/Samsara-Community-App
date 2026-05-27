import { MONTH_SHORT } from './constants.js';

export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return 'R 0';
  return `R ${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCurrencyDecimal(amount) {
  if (amount == null || isNaN(amount)) return 'R 0.00';
  return `R ${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMonthYear(year, month) {
  return `${MONTH_SHORT[month - 1]} ${year}`;
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function prevMonth(year, month) {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export function nextMonth(year, month) {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

export function last12Months() {
  const result = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return result;
}

export function calcMarginPct(sellPrice, cogs) {
  if (!sellPrice || sellPrice === 0) return 0;
  return Math.round(((sellPrice - cogs) / sellPrice) * 100);
}

export function sumProductCogs(costComponents) {
  return (costComponents || []).reduce((sum, c) => sum + (c.amount || 0), 0);
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
