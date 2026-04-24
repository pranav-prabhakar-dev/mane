export const CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "CAD", label: "Canadian Dollar", symbol: "$" },
  { code: "AUD", label: "Australian Dollar", symbol: "$" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "SGD", label: "Singapore Dollar", symbol: "$" },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ" },
  { code: "CNY", label: "Chinese Yuan", symbol: "¥" },
  { code: "CHF", label: "Swiss Franc", symbol: "Fr" },
  { code: "ZAR", label: "South African Rand", symbol: "R" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function isValidCurrency(code: string): code is CurrencyCode {
  return CURRENCIES.some((c) => c.code === code);
}

export function formatMoney(amount: number, currency: string = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
