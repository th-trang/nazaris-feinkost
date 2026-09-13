"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useParams} from "next/navigation";
import {
  ArrowLeft,
  Download,
  LoaderCircle,
  Lock,
  Printer,
  RefreshCw,
} from "lucide-react";
import {useTranslations} from "next-intl";
import {watchAuthUser, isAdminUser} from "@/app/lib/firebase/auth";
import {getAccountingOrders} from "@/app/lib/firebase/orders";
import {
  bookingDate,
  resolvePreset,
  settledAmount,
  splitVat,
  summariseOrders,
  type RangePreset,
} from "@/app/lib/orders/accounting";
import type {AccountingOrder} from "@/app/lib/orders/types";
import {downloadCsv, toCsv, toCsvNumber} from "@/app/lib/helper/csv";
import AccountingReport from "@/app/components/AccountingReport";

type AccessState = "checking" | "unauthenticated" | "forbidden" | "authorized";

const VAT_RATES = [7, 19, 0];

const PRESETS: RangePreset[] = [
  "thisMonth",
  "lastMonth",
  "thisQuarter",
  "thisYear",
  "lastYear",
];

export default function StaffAccountingPage() {
  const t = useTranslations("staffAccounting");
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "de";

  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [range, setRange] = useState(() => resolvePreset("thisYear"));
  const [vatRate, setVatRate] = useState(VAT_RATES[0]);
  const [showItems, setShowItems] = useState(false);
  const [orders, setOrders] = useState<AccountingOrder[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const summary = useMemo(() => summariseOrders(orders), [orders]);

  const loadOrders = useCallback(async () => {
    if (accessState !== "authorized") return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getAccountingOrders(range);
      setOrders(result.orders);
      setTruncated(result.truncated);
      setHasLoaded(true);
    } catch {
      setError(t("loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [accessState, range, t]);

  const handleExportCsv = () => {
    const header = [
      t("colOrderNumber"),
      t("colDate"),
      t("colCustomer"),
      t("csvEmail"),
      t("csvPickupDate"),
      t("csvPickupLocation"),
      t("colPaymentMethod"),
      t("csvSubtotal"),
      t("csvDiscount"),
      t("colNet"),
      t("colVat"),
      t("colGross"),
      t("colStatus"),
      t("csvItems"),
    ];

    const rows = orders.map((order) => {
      const gross = settledAmount(order);
      const {net, vat} = splitVat(gross, vatRate);
      const date = bookingDate(order);

      return [
        order.orderNumber || order.id,
        date ? date.slice(0, 10) : "",
        `${order.customer.firstName} ${order.customer.lastName}`.trim(),
        order.customer.email,
        order.pickup.date,
        order.pickup.location,
        t(`paymentMethods.${order.payment.method}`),
        toCsvNumber(order.totals.subtotal),
        toCsvNumber(order.totals.discount ?? 0),
        toCsvNumber(net),
        toCsvNumber(vat),
        toCsvNumber(gross),
        order.refunded
          ? t("statusRefunded")
          : order.payment.status === "underpaid"
            ? t("statusUnderpaid")
            : t("statusPaid"),
        order.items.map((item) => `${item.quantity}x ${item.name}`).join(" | "),
      ];
    });

    downloadCsv(
      `umsatz-${range.from}-bis-${range.to}.csv`,
      toCsv([header, ...rows]),
    );
  };

  useEffect(() => {
    let mounted = true;

    const unsubscribe = watchAuthUser((user) => {
      void (async () => {
        if (!mounted) return;

        if (!user) {
          setAccessState("unauthenticated");
          return;
        }

        try {
          // Revenue figures are the owner's business, not every shift's — so
          // this page is admin-only rather than staff-wide.
          const admin = await isAdminUser(user);
          if (!mounted) return;
          setAccessState(admin ? "authorized" : "forbidden");
        } catch {
          if (mounted) setAccessState("forbidden");
        }
      })();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (accessState !== "authorized") return;
    void loadOrders();
  }, [accessState, loadOrders]);

  if (accessState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <LoaderCircle className="w-10 h-10 animate-spin mx-auto text-green-600" />
          <p className="mt-3 text-gray-700">{t("checkingAccess")}</p>
        </div>
      </div>
    );
  }

  if (accessState !== "authorized") {
    const isSignedOut = accessState === "unauthenticated";

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
          <Lock
            className={`w-10 h-10 mx-auto ${isSignedOut ? "text-amber-600" : "text-red-600"}`}
          />
          <h1 className="text-2xl text-gray-900 mt-4">
            {isSignedOut ? t("signInRequiredTitle") : t("accessDeniedTitle")}
          </h1>
          <p className="text-gray-700 mt-2">
            {isSignedOut ? t("signInRequiredDescription") : t("accessDeniedDescription")}
          </p>
          <Link
            href={isSignedOut ? `/${locale}/staff/login` : `/${locale}/staff/orders`}
            className="inline-block mt-6 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            {isSignedOut ? t("goToLogin") : t("backToOrders")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 print:min-h-0 print:p-0">
      <div className="max-w-6xl mx-auto pt-[130px] print:pt-0 print:max-w-none">
        {/* Everything above the report is screen-only: the printout starts at
            the report itself. */}
        <div className="print:hidden">
          <Link
            href={`/${locale}/staff/orders`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToOrders")}
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-4 mt-4 mb-6">
            <div>
              <h1 className="text-4xl lg:text-5xl tracking-tight text-gray-900">
                {t("pageTitle")}
              </h1>
              <p className="text-gray-700 mt-2">{t("pageDescription")}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadOrders()}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white/80 rounded-xl border border-gray-200 text-gray-700 hover:bg-white disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span>{t("refresh")}</span>
              </button>

              <button
                onClick={handleExportCsv}
                disabled={isLoading || orders.length === 0}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white/80 rounded-xl border border-gray-200 text-gray-700 hover:bg-white disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>{t("exportCsv")}</span>
              </button>

              <button
                onClick={() => window.print()}
                disabled={isLoading || orders.length === 0}
                className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-60"
              >
                <Printer className="w-4 h-4" />
                <span>{t("print")}</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-100 mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESETS.map((preset) => {
                const presetRange = resolvePreset(preset);
                const isActive =
                  presetRange.from === range.from && presetRange.to === range.to;

                return (
                  <button
                    key={preset}
                    onClick={() => setRange(presetRange)}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      isActive
                        ? "bg-green-600 text-white shadow"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-green-300"
                    }`}
                  >
                    {t(`presets.${preset}`)}
                  </button>
                );
              })}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="text-sm text-gray-700">
                <span className="block mb-1">{t("from")}</span>
                <input
                  type="date"
                  value={range.from}
                  max={range.to}
                  onChange={(e) => setRange((r) => ({...r, from: e.target.value}))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </label>

              <label className="text-sm text-gray-700">
                <span className="block mb-1">{t("to")}</span>
                <input
                  type="date"
                  value={range.to}
                  min={range.from}
                  onChange={(e) => setRange((r) => ({...r, to: e.target.value}))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </label>

              <label className="text-sm text-gray-700">
                <span className="block mb-1">{t("vatRate")}</span>
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  {VAT_RATES.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate === 0 ? t("vatNone") : `${rate} %`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-end gap-2 text-sm text-gray-700 pb-2">
                <input
                  type="checkbox"
                  checked={showItems}
                  onChange={(e) => setShowItems(e.target.checked)}
                  className="w-4 h-4 accent-green-600"
                />
                <span>{t("showItems")}</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {truncated && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              {t("truncatedWarning")}
            </div>
          )}

          {isLoading && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm inline-flex items-center gap-2">
              <LoaderCircle className="w-4 h-4 animate-spin" />
              {t("loading")}
            </div>
          )}
        </div>

        {hasLoaded && (
          <AccountingReport
            orders={orders}
            summary={summary}
            range={range}
            vatRate={vatRate}
            showItems={showItems}
            locale={locale}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
