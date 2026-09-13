/**
 * Turning settled orders into the figures a bookkeeping report shows.
 *
 * Everything here is pure arithmetic on orders that have already been fetched:
 * what was taken in, what went back out as refunds, and how a gross amount
 * splits into net and VAT. Nothing in this file decides *which* orders belong
 * in a report — that is the query in lib/firebase/orders.ts.
 */
import type {AccountingOrder, AccountingSummary} from "./types";

/** Cents are the smallest unit money is reported in, so round to them once. */
export const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/** What an order was actually paid at — an underpayment settled for less. */
export const settledAmount = (order: AccountingOrder): number =>
  order.amountReceived ?? order.totals.total ?? order.totals.subtotal ?? 0;

/**
 * The date the report files an order under: when the money arrived, falling
 * back to when the order was placed for orders that predate `paidAt`.
 */
export const bookingDate = (order: AccountingOrder): string =>
  order.paidAt ?? order.createdAt ?? "";

export const summariseOrders = (
  orders: AccountingOrder[],
): AccountingSummary => {
  let paidTotal = 0;
  let refundedTotal = 0;
  let refundedCount = 0;
  let discountTotal = 0;

  for (const order of orders) {
    const amount = settledAmount(order);
    paidTotal += amount;
    discountTotal += order.totals.discount ?? 0;

    if (order.refunded) {
      refundedTotal += amount;
      refundedCount += 1;
    }
  }

  return {
    orderCount: orders.length,
    refundedCount,
    paidTotal: roundCurrency(paidTotal),
    refundedTotal: roundCurrency(refundedTotal),
    revenue: roundCurrency(paidTotal - refundedTotal),
    discountTotal: roundCurrency(discountTotal),
    currency: orders[0]?.totals.currency ?? "EUR",
  };
};

/**
 * Splits a gross amount into net and VAT at the given rate.
 *
 * Shop prices are gross (as consumer prices must be), so VAT is worked out of
 * the amount rather than added on top. A rate of 0 leaves the amount alone.
 */
export const splitVat = (
  gross: number,
  ratePercent: number,
): {net: number; vat: number} => {
  if (!ratePercent) {
    return {net: roundCurrency(gross), vat: 0};
  }

  const net = roundCurrency(gross / (1 + ratePercent / 100));
  return {net, vat: roundCurrency(gross - net)};
};

/** The date presets the report offers, all resolved against `today`. */
export type RangePreset =
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "thisYear"
  | "lastYear";

const toIsoDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export const resolvePreset = (
  preset: RangePreset,
  today = new Date(),
): {from: string; to: string} => {
  const year = today.getFullYear();
  const month = today.getMonth();

  switch (preset) {
    case "thisMonth":
      return {
        from: toIsoDate(new Date(year, month, 1)),
        to: toIsoDate(new Date(year, month + 1, 0)),
      };
    case "lastMonth":
      return {
        from: toIsoDate(new Date(year, month - 1, 1)),
        to: toIsoDate(new Date(year, month, 0)),
      };
    case "thisQuarter": {
      const quarterStart = Math.floor(month / 3) * 3;
      return {
        from: toIsoDate(new Date(year, quarterStart, 1)),
        to: toIsoDate(new Date(year, quarterStart + 3, 0)),
      };
    }
    case "lastYear":
      return {
        from: toIsoDate(new Date(year - 1, 0, 1)),
        to: toIsoDate(new Date(year - 1, 11, 31)),
      };
    case "thisYear":
    default:
      return {
        from: toIsoDate(new Date(year, 0, 1)),
        to: toIsoDate(new Date(year, 11, 31)),
      };
  }
};
