"use client";

import {useTranslations} from "next-intl";
import {toCurrency} from "@/app/lib/helper/Utils";
import {
  bookingDate,
  settledAmount,
  splitVat,
} from "@/app/lib/orders/accounting";
import type {
  AccountingOrder,
  AccountingRange,
  AccountingSummary,
} from "@/app/lib/orders/types";

/**
 * The printable bookkeeping document.
 *
 * Everything in here is what ends up on paper, so it carries no controls and
 * no interactive state — the surrounding page owns those and hides itself
 * from print. Layout is deliberately plain: black on white, no shadows, no
 * rounded cards, because that is what survives a printer and what a tax
 * office expects to read.
 */
export default function AccountingReport({
  orders,
  summary,
  range,
  vatRate,
  showItems,
  locale,
  t,
}: {
  orders: AccountingOrder[];
  summary: AccountingSummary;
  range: AccountingRange;
  vatRate: number;
  showItems: boolean;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const money = (value: number) => toCurrency(value, summary.currency, locale);
  const revenueSplit = splitVat(summary.revenue, vatRate);

  const dateFormat = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const toDayLabel = (value: string): string => {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "—" : dateFormat.format(parsed);
  };

  const rangeLabel = `${toDayLabel(`${range.from}T12:00:00`)} – ${toDayLabel(
    `${range.to}T12:00:00`,
  )}`;

  return (
    <div className="bg-white text-gray-900 rounded-2xl border border-gray-200 p-6 print:rounded-none print:border-0 print:p-0 print:text-black">
      {/* Document header */}
      <header className="border-b border-gray-300 pb-4 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl print:text-xl">{t("reportTitle")}</h2>
            <p className="text-sm text-gray-600 print:text-black">
              Nazari&apos;s Feinkost · Hamburg
            </p>
          </div>
          <dl className="text-sm text-right">
            <div className="flex gap-2 justify-end">
              <dt className="text-gray-600 print:text-black">{t("period")}:</dt>
              <dd className="font-medium">{rangeLabel}</dd>
            </div>
            <div className="flex gap-2 justify-end">
              <dt className="text-gray-600 print:text-black">{t("printedOn")}:</dt>
              <dd>{toDayLabel(new Date().toISOString())}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* Summary */}
      <section className="mb-6 break-inside-avoid">
        <h3 className="text-sm uppercase tracking-wide text-gray-500 print:text-black mb-2">
          {t("summaryTitle")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <SummaryCell label={t("orderCount")} value={String(summary.orderCount)} />
          <SummaryCell label={t("paidTotal")} value={money(summary.paidTotal)} />
          <SummaryCell
            label={`${t("refundedTotal")} (${summary.refundedCount})`}
            value={`−${money(summary.refundedTotal)}`}
          />
          <SummaryCell label={t("revenue")} value={money(summary.revenue)} strong />
        </div>

        {vatRate > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
            <SummaryCell
              label={t("netRevenue", {rate: vatRate})}
              value={money(revenueSplit.net)}
            />
            <SummaryCell
              label={t("vatAmount", {rate: vatRate})}
              value={money(revenueSplit.vat)}
            />
            <SummaryCell label={t("discountTotal")} value={money(summary.discountTotal)} />
          </div>
        )}
      </section>

      {/* Order table */}
      <table className="w-full text-sm border-collapse print:text-[10pt]">
        <thead>
          <tr className="border-y border-gray-400 text-left">
            <th className="py-2 pr-2 font-medium">{t("colOrderNumber")}</th>
            <th className="py-2 pr-2 font-medium">{t("colDate")}</th>
            <th className="py-2 pr-2 font-medium">{t("colCustomer")}</th>
            <th className="py-2 pr-2 font-medium">{t("colPaymentMethod")}</th>
            <th className="py-2 pr-2 font-medium text-right">{t("colNet")}</th>
            <th className="py-2 pr-2 font-medium text-right">{t("colVat")}</th>
            <th className="py-2 pr-2 font-medium text-right">{t("colGross")}</th>
            <th className="py-2 font-medium">{t("colStatus")}</th>
          </tr>
        </thead>

        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan={8} className="py-6 text-center text-gray-500">
                {t("noOrders")}
              </td>
            </tr>
          )}

          {orders.map((order) => {
            const gross = settledAmount(order);
            const {net, vat} = splitVat(gross, vatRate);

            return (
              <tr
                key={order.id}
                className={`border-b border-gray-200 align-top break-inside-avoid ${
                  order.refunded ? "text-gray-500 print:text-black" : ""
                }`}
              >
                <td className="py-1.5 pr-2 whitespace-nowrap">
                  {order.orderNumber || order.id}
                </td>
                <td className="py-1.5 pr-2 whitespace-nowrap">
                  {toDayLabel(bookingDate(order))}
                </td>
                <td className="py-1.5 pr-2">
                  {order.customer.firstName} {order.customer.lastName}
                  {showItems && order.items.length > 0 && (
                    <span className="block text-xs text-gray-500 print:text-black">
                      {order.items
                        .map((item) => `${item.quantity}× ${item.name}`)
                        .join(", ")}
                    </span>
                  )}
                </td>
                <td className="py-1.5 pr-2 whitespace-nowrap">
                  {t(`paymentMethods.${order.payment.method}`)}
                </td>
                <td className="py-1.5 pr-2 text-right whitespace-nowrap">{money(net)}</td>
                <td className="py-1.5 pr-2 text-right whitespace-nowrap">{money(vat)}</td>
                <td className="py-1.5 pr-2 text-right whitespace-nowrap font-medium">
                  {order.refunded ? `(${money(gross)})` : money(gross)}
                </td>
                <td className="py-1.5 whitespace-nowrap">
                  {order.refunded
                    ? t("statusRefunded")
                    : order.payment.status === "underpaid"
                      ? t("statusUnderpaid")
                      : t("statusPaid")}
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="border-t-2 border-gray-500 font-medium">
            <td className="py-2 pr-2" colSpan={4}>
              {t("totalRow")}
            </td>
            <td className="py-2 pr-2 text-right whitespace-nowrap">
              {money(revenueSplit.net)}
            </td>
            <td className="py-2 pr-2 text-right whitespace-nowrap">
              {money(revenueSplit.vat)}
            </td>
            <td className="py-2 pr-2 text-right whitespace-nowrap">
              {money(summary.revenue)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>

      <footer className="mt-4 pt-3 border-t border-gray-300 text-xs text-gray-600 print:text-black space-y-1">
        <p>{t("footnoteScope")}</p>
        <p>{t("footnoteRefunds")}</p>
        {vatRate > 0 && <p>{t("footnoteVat", {rate: vatRate})}</p>}
      </footer>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`border border-gray-200 rounded-lg px-3 py-2 print:rounded-none ${
        strong ? "bg-gray-50 print:bg-transparent" : ""
      }`}
    >
      <p className="text-xs text-gray-500 print:text-black">{label}</p>
      <p className={`text-base ${strong ? "font-semibold" : ""}`}>{value}</p>
    </div>
  );
}
