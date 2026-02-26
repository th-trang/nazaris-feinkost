"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {ClipboardList, Lock, LoaderCircle, RefreshCw} from "lucide-react";
import {useTranslations} from "next-intl";
import {watchAuthUser, isStaffUser} from "@/app/lib/firebase/auth";
import {signOut} from "firebase/auth";
import {getFirebaseAuth} from "@/app/lib/firebase/client";
import {getStaffOrders} from "@/app/lib/firebase/orders";
import {StaffOrder} from "@/app/lib/orders/types";

type AccessState = "checking" | "unauthenticated" | "forbidden" | "authorized";

const toDateLabel = (date: string, locale: string): string => {
  if (!date) {
    return "-";
  }

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
  });
};

const toCurrency = (value: number, currency: string, locale: string): string => {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency: currency || "EUR",
  }).format(value);
};

function OrderCard({
  order,
  locale,
  t,
}: {
  order: StaffOrder;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{t("orderNumber")}</p>
          <p className="text-lg text-gray-900 font-semibold">{order.orderNumber || order.id}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 capitalize">
          {order.status}
        </span>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">{t("customer")}</p>
          <p className="text-gray-900">{order.customer.firstName} {order.customer.lastName}</p>
          <p className="text-gray-700">{order.customer.email}</p>
          <p className="text-gray-700">{order.customer.phone}</p>
        </div>

        <div>
          <p className="text-gray-500">{t("pickup")}</p>
          <p className="text-gray-900">{toDateLabel(order.pickup.date, locale)}</p>
          <p className="text-gray-700">{order.pickup.location}</p>
        </div>

        <div>
          <p className="text-gray-500">{t("payment")}</p>
          <p className="text-gray-900 capitalize">{order.payment.method}</p>
          <p className="text-gray-700 capitalize">{order.payment.status}</p>
        </div>

        <div>
          <p className="text-gray-500">{t("total")}</p>
          <p className="text-gray-900">{toCurrency(order.totals.subtotal, order.totals.currency, locale)}</p>
        </div>
      </div>
    </div>
  );
}

export default function StaffOrdersPage() {
  const t = useTranslations("staffOrders");
  const params = useParams();
  const router = useRouter();
  const locale = typeof params?.locale === "string" ? params.locale : "de";

  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<StaffOrder[]>([]);
  const [past, setPast] = useState<StaffOrder[]>([]);

  const canLoadOrders = useMemo(() => accessState === "authorized", [accessState]);

  const loadOrders = useCallback(async () => {
    if (!canLoadOrders) {
      return;
    }

    setIsLoadingOrders(true);
    setError(null);

    try {
      const result = await getStaffOrders();
      setUpcoming(result.upcoming);
      setPast(result.past);
    } catch {
      setError(t("loadError"));
    } finally {
      setIsLoadingOrders(false);
    }
  }, [canLoadOrders, t]);

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await signOut(getFirebaseAuth());
      router.replace(`/${locale}/staff/login`);
    } catch {
      setError(t("logoutFailed"));
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const unsubscribe = watchAuthUser((user) => {
      void (async () => {
        if (!mounted) {
          return;
        }

        if (!user) {
          setAccessState("unauthenticated");
          return;
        }

        try {
          const staff = await isStaffUser(user);
          if (!mounted) {
            return;
          }
          setAccessState(staff ? "authorized" : "forbidden");
        } catch {
          if (!mounted) {
            return;
          }
          setAccessState("forbidden");
        }
      })();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (accessState !== "authorized") {
      return;
    }

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

  if (accessState === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
          <Lock className="w-10 h-10 mx-auto text-amber-600" />
          <h1 className="text-2xl text-gray-900 mt-4">{t("signInRequiredTitle")}</h1>
          <p className="text-gray-700 mt-2">{t("signInRequiredDescription")}</p>
          <Link
            href={`/${locale}/home`}
            className="inline-block mt-6 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>
    );
  }

  if (accessState === "forbidden") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
          <Lock className="w-10 h-10 mx-auto text-red-600" />
          <h1 className="text-2xl text-gray-900 mt-4">{t("accessDeniedTitle")}</h1>
          <p className="text-gray-700 mt-2">{t("accessDeniedDescription")}</p>
          <Link
            href={`/${locale}/home`}
            className="inline-block mt-6 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto pt-[50px]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl lg:text-5xl tracking-tight text-gray-900">{t("title")}</h1>
            <p className="text-gray-700 mt-2">{t("description")}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                void loadOrders();
              }}
              disabled={isLoadingOrders || isSigningOut}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white/80 rounded-xl border border-gray-200 text-gray-700 hover:bg-white disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? "animate-spin" : ""}`} />
              <span>{t("refresh")}</span>
            </button>

            <button
              onClick={() => {
                void handleLogout();
              }}
              disabled={isSigningOut || isLoadingOrders}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white/80 rounded-xl border-2 border-red-500 text-red-600 hover:bg-white disabled:opacity-60"
            >
              <span>{isSigningOut ? t("loggingOut") : t("logout")}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {isLoadingOrders && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm inline-flex items-center gap-2">
            <LoaderCircle className="w-4 h-4 animate-spin" />
            {t("loadingOrders")}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-green-600" />
              <h2 className="text-2xl text-gray-900">{t("upcoming")}</h2>
              <span className="text-sm text-gray-500">({upcoming.length})</span>
            </div>

            <div className="space-y-4">
              {upcoming.length === 0 ? (
                <div className="p-5 rounded-xl bg-white/70 border border-gray-200 text-gray-600 text-sm">
                  {t("noUpcoming")}
                </div>
              ) : (
                upcoming.map((order) => (
                  <OrderCard key={order.id} order={order} locale={locale} t={t} />
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-gray-500" />
              <h2 className="text-2xl text-gray-900">{t("past")}</h2>
              <span className="text-sm text-gray-500">({past.length})</span>
            </div>

            <div className="space-y-4">
              {past.length === 0 ? (
                <div className="p-5 rounded-xl bg-white/70 border border-gray-200 text-gray-600 text-sm">
                  {t("noPast")}
                </div>
              ) : (
                past.map((order) => (
                  <OrderCard key={order.id} order={order} locale={locale} t={t} />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
