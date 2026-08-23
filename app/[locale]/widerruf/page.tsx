"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, AlertTriangle, Search, X } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "@/app/lib/firebase/client";

type Step = "form" | "confirm" | "success" | "error";

interface OrderInfo {
  orderId: string;
  orderNumber: string;
  status: string;
  isComplete: boolean;
  pickupDate: string;
  pickupLocation: string;
  total: number;
  currency: string;
}

interface WiderrufPayload {
  action: "lookup" | "cancel";
  orderNumber: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface CancelResult {
  success: boolean;
  orderNumber: string;
  refunded: boolean;
}

function errorCodeToKey(code: string, message: string): string {
  if (message === "already_canceled") return "errorAlreadyCanceled";
  if (message === "already_completed") return "errorAlreadyCompleted";
  if (message === "not_found" || code === "not-found") return "errorNotFound";
  if (message === "not_cancellable") return "errorFailed";
  if (message === "refund_failed") return "errorRefundFailed";
  return "errorGeneric";
}

export default function WiderrufPage() {
  const t = useTranslations("widerruf");
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "de";

  const [step, setStep] = useState<Step>("form");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [wasRefunded, setWasRefunded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const callWiderruf = httpsCallable<WiderrufPayload, OrderInfo & CancelResult>(
    getFirebaseFunctions(),
    "widerrufOrder",
  );

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);

    try {
      const result = await callWiderruf({ action: "lookup", orderNumber, email, firstName, lastName });
      const data = result.data;

      if (data.status === "canceled") { setApiError(t("errorAlreadyCanceled")); return; }
      if (data.isComplete)            { setApiError(t("errorAlreadyCompleted")); return; }
      if (data.status === "failed")   { setApiError(t("errorFailed")); return; }

      setOrderInfo(data);
      setStep("confirm");
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      setApiError(t(errorCodeToKey(fe.code ?? "", fe.message ?? "")));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancel() {
    setIsLoading(true);
    setApiError(null);

    try {
      const result = await callWiderruf({ action: "cancel", orderNumber, email, firstName, lastName });
      setWasRefunded(result.data.refunded === true);
      setStep("success");
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      setApiError(t(errorCodeToKey(fe.code ?? "", fe.message ?? "")));
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto pt-[50px]">

        {/* ── Success ─────────────────────────────────────────────────── */}
        {step === "success" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg border border-gray-100 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl text-gray-900 mb-3">{t("successTitle")}</h1>
            <p className="text-gray-600 mb-2">{t("successMessage")}</p>
            <p className="text-sm text-gray-500 mb-8">
              {wasRefunded ? t("successNoteRefunded") : t("successNote")}
            </p>
            <Link
              href={`/${locale}/home`}
              className="inline-block px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow"
            >
              {t("backToHome")}
            </Link>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────── */}
        {step === "error" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg border border-gray-100 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl text-gray-900 mb-3">{t("errorTitle")}</h1>
            <p className="text-gray-600 mb-8">{apiError}</p>
            <Link
              href={`/${locale}/home`}
              className="inline-block px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all shadow"
            >
              {t("backToHome")}
            </Link>
          </div>
        )}

        {/* ── Lookup Form ─────────────────────────────────────────────── */}
        {step === "form" && (
          <>
            <h1 className="text-3xl text-gray-900 mb-3">{t("title")}</h1>
            <p className="text-gray-600 mb-8">{t("description")}</p>

            <form
              onSubmit={handleLookup}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("orderNumber")}
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="z.B. NAZ-001"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("firstName")}
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("lastName")}
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("email")}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {apiError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  t("searching")
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    {t("findOrder")}
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* ── Confirm ─────────────────────────────────────────────────── */}
        {step === "confirm" && orderInfo && (
          <>
            <h1 className="text-3xl text-gray-900 mb-3">{t("title")}</h1>
            <p className="text-gray-600 mb-6">{t("confirmDescription")}</p>

            {/* Order summary card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("orderNumber")}</span>
                <span className="font-medium text-gray-900">{orderInfo.orderNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("pickupDate")}</span>
                <span className="text-gray-900">{orderInfo.pickupDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("pickupLocation")}</span>
                <span className="text-gray-900">{orderInfo.pickupLocation}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
                <span className="text-gray-500">{t("total")}</span>
                <span className="font-semibold text-gray-900">
                  €{orderInfo.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-sm text-amber-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{t("cancelWarning")}</span>
            </div>

            {apiError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {apiError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep("form"); setApiError(null); }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                {t("goBack")}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t("canceling") : t("confirmCancel")}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
