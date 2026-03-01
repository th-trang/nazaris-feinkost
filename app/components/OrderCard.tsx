'use client';

import { useTranslations } from "next-intl";
import { toCurrency, toDateLabel } from "@/app/lib/helper/Utils";
import { StaffOrder } from "../lib/orders/types";

export default function OrderCard({
    order,
    locale,
    t,
    onSelect,
  }: {
    order: StaffOrder;
    locale: string;
    t: ReturnType<typeof useTranslations>;
    onSelect: () => void;
  }) {
    return (
      <button
        onClick={onSelect}
        className="w-full text-left bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-100 hover:border-green-300 hover:shadow-xl transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">{t("orderNumber")}</p>
            <p className="text-lg text-gray-900 font-semibold">{order.orderNumber || order.id}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs capitalize ${
            order.status === "completed" 
              ? "bg-green-100 text-green-700" 
              : "bg-amber-100 text-amber-700"
          }`}>
            {order.status}
          </span>
        </div>
  
        <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">{t("customer")}</p>
            <p className="text-gray-900">{order.customer.firstName} {order.customer.lastName}</p>
          </div>
  
          <div>
            <p className="text-gray-500">{t("pickup")}</p>
            <p className="text-gray-900">{toDateLabel(order.pickup.date, locale)}</p>
            <p className="text-gray-700">{order.pickup.location}</p>
          </div>
  
          <div>
            <p className="text-gray-500">{t("items")}</p>
            <p className="text-gray-900">{order.items.length} {t("itemsCount")}</p>
          </div>
  
          <div>
            <p className="text-gray-500">{t("total")}</p>
            <p className="text-gray-900">{toCurrency(order.totals.subtotal, order.totals.currency, locale)}</p>
          </div>
        </div>
      </button>
    );
  }