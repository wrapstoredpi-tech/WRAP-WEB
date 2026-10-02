/**
 * src/lib/currency.js
 * ───────────────────
 * Standardized Indian Rupee (INR / ₹) formatting helper across the entire store.
 */

export function formatINR(amount, options = {}) {
  const { showSymbol = true, decimals = 0 } = options;
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0' : '0';
  }
  const num = Number(amount);
  const formatted = decimals > 0
    ? num.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : Math.round(num).toLocaleString('en-IN');

  return showSymbol ? `₹${formatted}` : formatted;
}

export default formatINR;
