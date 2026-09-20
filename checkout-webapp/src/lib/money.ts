/** "NGN 8,500" — the currency code and the amount, comma-grouped, as the wireframe writes it. */
export function formatMoney(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount);
  return `${currency} ${formatted}`;
}
