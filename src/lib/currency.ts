export type Currency = 'USD' | 'EUR' | 'JOD';

export const CURRENCIES: Currency[] = ['USD', 'EUR', 'JOD'];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  JOD: 'JOD ',
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: 'USD ($)',
  EUR: 'EUR (€)',
  JOD: 'JOD',
};

export function formatCurrency(amount: number | null | undefined, currency: Currency = 'USD'): string {
  if (amount == null) return '-';
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getCurrencySymbol(currency: Currency = 'USD'): string {
  return CURRENCY_SYMBOLS[currency] || '$';
}
