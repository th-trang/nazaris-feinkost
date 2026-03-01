"use client";

import { useTranslations } from "next-intl";
import { StaffOrder } from "../lib/orders/types";
import { LoaderCircle, X, CheckCircle } from "lucide-react";
import { toDateLabel, toCurrency } from "@/app/lib/helper/Utils";

export default function OrderDetailModal({
  order,
  locale,
  t,
  onClose,
  onMarkCompleted,
  isMarking,
}: {
  order: StaffOrder;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  onClose: () => void;
  onMarkCompleted: () => void;
  isMarking: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t("orderDetails")}
            </h2>
            <p className="text-sm text-gray-500">{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              {t("customerInfo")}
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-gray-900">
                <span className="text-gray-500">{t("name")}:</span>{" "}
                {order.customer.firstName} {order.customer.lastName}
              </p>
              <p className="text-gray-900">
                <span className="text-gray-500">{t("email")}:</span>{" "}
                {order.customer.email}
              </p>
              <p className="text-gray-900">
                <span className="text-gray-500">{t("phone")}:</span>{" "}
                {order.customer.phone}
              </p>
            </div>
          </div>

          {/* Pickup Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              {t("pickupInfo")}
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-gray-900">
                <span className="text-gray-500">{t("location")}:</span>{" "}
                {order.pickup.location}
              </p>
              <p className="text-gray-900">
                <span className="text-gray-500">{t("date")}:</span>{" "}
                {toDateLabel(order.pickup.date, locale)}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              {t("orderItems")}
            </h3>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      {t("itemName")}
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                      {t("quantity")}
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                      {t("weight")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {item.weightInGrams ? `${item.weightInGrams}g` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center bg-green-50 rounded-xl p-4">
            <span className="font-medium text-gray-700">{t("total")}</span>
            <span className="text-xl font-semibold text-green-700">
              {toCurrency(order.totals.subtotal, order.totals.currency, locale)}
            </span>
          </div>

          {/* Mark Complete Button */}
          {order.status !== "completed" && (
            <button
              onClick={onMarkCompleted}
              disabled={isMarking}
              className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isMarking ? (
                <>
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                  {t("marking")}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {t("markCompleted")}
                </>
              )}
            </button>
          )}

          {order.status === "completed" && (
            <div className="flex items-center justify-center gap-2 py-3 bg-green-100 text-green-700 rounded-xl">
              <CheckCircle className="w-5 h-5" />
              {t("orderCompleted")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
