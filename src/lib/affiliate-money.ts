function assertInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`${label} must be a safe integer`)
  }
}

export function calculateCommissionMinor(revenueMinor: number, rateBps: number): number {
  assertInteger(revenueMinor, 'revenueMinor')
  assertInteger(rateBps, 'rateBps')
  if (revenueMinor < 0) throw new RangeError('revenueMinor must be non-negative')
  if (rateBps < 0 || rateBps > 10_000) throw new RangeError('rateBps rate must be between 0 and 10000')
  return Math.floor((revenueMinor * rateBps + 5_000) / 10_000)
}

/**
 * Computes the next negative ledger adjustment from cumulative refund totals.
 * Cumulative proportional calculation prevents repeated partial-refund rounding
 * from ever reversing more than the original commission.
 */
export function calculateCumulativeAdjustmentMinor(
  originalRevenueMinor: number,
  originalCommissionMinor: number,
  alreadyAdjustedCommissionMinor: number,
  cumulativeRefundedRevenueMinor: number,
): number {
  for (const [value, label] of [
    [originalRevenueMinor, 'originalRevenueMinor'],
    [originalCommissionMinor, 'originalCommissionMinor'],
    [alreadyAdjustedCommissionMinor, 'alreadyAdjustedCommissionMinor'],
    [cumulativeRefundedRevenueMinor, 'cumulativeRefundedRevenueMinor'],
  ] as const) assertInteger(value, label)

  if (originalRevenueMinor <= 0 || originalCommissionMinor < 0) {
    throw new RangeError('original amounts are invalid')
  }
  if (alreadyAdjustedCommissionMinor < 0 || cumulativeRefundedRevenueMinor < 0) {
    throw new RangeError('adjustment totals must be non-negative')
  }

  const cappedRevenue = Math.min(cumulativeRefundedRevenueMinor, originalRevenueMinor)
  const targetAdjusted = Math.floor(
    (originalCommissionMinor * cappedRevenue + Math.floor(originalRevenueMinor / 2)) /
      originalRevenueMinor,
  )
  const delta = Math.max(0, targetAdjusted - Math.min(alreadyAdjustedCommissionMinor, originalCommissionMinor))
  return delta === 0 ? 0 : -delta
}
