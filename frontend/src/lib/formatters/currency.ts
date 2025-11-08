/**
 * Currency Formatting Utilities
 * Consistent currency formatting across web and mobile apps
 */

/**
 * Format a number as Euro currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "1.234,56 €")
 */
export function formatEuro(
  amount: number,
  options: {
    showCurrency?: boolean
    decimals?: number
    compact?: boolean
  } = {}
): string {
  const { showCurrency = true, decimals = 2, compact = false } = options

  if (compact && Math.abs(amount) >= 1000000) {
    const millions = amount / 1000000
    return `${millions.toFixed(1)}M €`
  }

  if (compact && Math.abs(amount) >= 1000) {
    const thousands = amount / 1000
    return `${thousands.toFixed(1)}K €`
  }

  const formatted = new Intl.NumberFormat('de-DE', {
    style: showCurrency ? 'currency' : 'decimal',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)

  return formatted
}

/**
 * Format currency without symbol
 */
export function formatAmount(amount: number, decimals: number = 2): string {
  return formatEuro(amount, { showCurrency: false, decimals })
}

/**
 * Format currency in compact form (e.g., "1.2K €", "3.5M €")
 */
export function formatCompactEuro(amount: number): string {
  return formatEuro(amount, { compact: true })
}

/**
 * Parse a German formatted currency string to number
 * @param value - String like "1.234,56 €" or "1.234,56"
 * @returns Numeric value
 */
export function parseEuro(value: string): number {
  // Remove currency symbol and spaces
  const cleaned = value.replace(/[€\s]/g, '')
  // Replace German thousand separator (.) with nothing
  const withoutThousands = cleaned.replace(/\./g, '')
  // Replace German decimal separator (,) with dot
  const normalized = withoutThousands.replace(',', '.')
  return parseFloat(normalized)
}

/**
 * Format a percentage
 * @param value - The percentage value (0.25 = 25%)
 * @param options - Formatting options
 */
export function formatPercent(
  value: number,
  options: { decimals?: number; includeSign?: boolean } = {}
): string {
  const { decimals = 0, includeSign = true } = options

  const formatted = new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)

  if (!includeSign) {
    return formatted.replace('%', '').trim()
  }

  return formatted
}
