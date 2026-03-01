"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {
  ClipboardList,
  Lock,
  LoaderCircle,
  RefreshCw,
  Users,
  CheckCircle,
  X,
  Edit2,
  Save,
  XCircle,
} from "lucide-react";
import {useTranslations} from "next-intl";
import {watchAuthUser, isStaffUser, isAdminUser} from "@/app/lib/firebase/auth";
import {signOut} from "firebase/auth";
import {getFirebaseAuth} from "@/app/lib/firebase/client";
import {getStaffOrders, markOrderCompleted, getStaffUsers, updateUser} from "@/app/lib/firebase/orders";
import {StaffOrder, StaffUser} from "@/app/lib/orders/types";

type AccessState = "checking" | "unauthenticated" | "forbidden" | "authorized";
type Tab = "orders" | "users";

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

const toCreatedAtLabel = (dateStr: string | undefined, locale: string): string => {
  if (!dateStr) {
    return "-";
  }

  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }

  return parsed.toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
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

function OrderDetailModal({
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
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t("customerInfo")}</h3>
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
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t("pickupInfo")}</h3>
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
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t("orderItems")}</h3>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t("itemName")}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">{t("quantity")}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">{t("weight")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
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

function UserRow({
  user,
  locale,
  t,
  onUpdate,
}: {
  user: StaffUser;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  onUpdate: (userId: string, updates: Partial<StaffUser>) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(user.id, {firstName, lastName, email, phone});
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setPhone(user.phone);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm"
              placeholder={t("firstName")}
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm"
              placeholder={t("lastName")}
            />
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {toCreatedAtLabel(user.createdAt, locale)}
        </td>
        <td className="px-4 py-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
            placeholder={t("email")}
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
            placeholder={t("phone")}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {isSaving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">
        {user.firstName} {user.lastName}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {toCreatedAtLabel(user.createdAt, locale)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{user.phone}</td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function UsersTable({
  users,
  locale,
  t,
  onUpdate,
  isLoading,
}: {
  users: StaffUser[];
  locale: string;
  t: ReturnType<typeof useTranslations>;
  onUpdate: (userId: string, updates: Partial<StaffUser>) => Promise<void>;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderCircle className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        {t("noUsers")}
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("userName")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("createdAt")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("email")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("phone")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                locale={locale}
                t={t}
                onUpdate={onUpdate}
              />
            ))}
          </tbody>
        </table>
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMarkingOrder, setIsMarkingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uncompleted, setUncompleted] = useState<StaffOrder[]>([]);
  const [completed, setCompleted] = useState<StaffOrder[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<StaffOrder | null>(null);

  const canLoadOrders = useMemo(() => accessState === "authorized", [accessState]);

  const loadOrders = useCallback(async () => {
    if (!canLoadOrders) {
      return;
    }

    setIsLoadingOrders(true);
    setError(null);

    try {
      const result = await getStaffOrders();
      setUncompleted(result.uncompleted);
      setCompleted(result.completed);
    } catch {
      setError(t("loadError"));
    } finally {
      setIsLoadingOrders(false);
    }
  }, [canLoadOrders, t]);

  const loadUsers = useCallback(async () => {
    if (!canLoadOrders || !isAdmin) {
      return;
    }

    setIsLoadingUsers(true);
    setError(null);

    try {
      const result = await getStaffUsers();
      setUsers(result.users);
    } catch {
      setError(t("loadUsersError"));
    } finally {
      setIsLoadingUsers(false);
    }
  }, [canLoadOrders, isAdmin, t]);

  const handleMarkCompleted = async () => {
    if (!selectedOrder) {
      return;
    }

    setIsMarkingOrder(true);
    try {
      await markOrderCompleted(selectedOrder.id);
      await loadOrders();
      setSelectedOrder(null);
    } catch {
      setError(t("markError"));
    } finally {
      setIsMarkingOrder(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<StaffUser>) => {
    try {
      await updateUser({
        userId,
        firstName: updates.firstName,
        lastName: updates.lastName,
        email: updates.email,
        phone: updates.phone,
      });
      await loadUsers();
    } catch {
      setError(t("updateUserError"));
    }
  };

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
          
          if (!staff) {
            setAccessState("forbidden");
            return;
          }

          const admin = await isAdminUser(user);
          if (!mounted) {
            return;
          }
          
          setIsAdmin(admin);
          setAccessState("authorized");
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

  useEffect(() => {
    if (accessState !== "authorized" || !isAdmin || activeTab !== "users") {
      return;
    }

    void loadUsers();
  }, [accessState, isAdmin, activeTab, loadUsers]);

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
            href={`/${locale}/staff/login`}
            className="inline-block mt-6 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            {t("goToLogin")}
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
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl lg:text-5xl tracking-tight text-gray-900">{t("dashboardTitle")}</h1>
            <p className="text-gray-700 mt-2">{t("dashboardDescription")}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeTab === "orders") {
                  void loadOrders();
                } else {
                  void loadUsers();
                }
              }}
              disabled={isLoadingOrders || isLoadingUsers || isSigningOut}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white/80 rounded-xl border border-gray-200 text-gray-700 hover:bg-white disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingOrders || isLoadingUsers ? "animate-spin" : ""}`} />
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

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("orders")}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              activeTab === "orders"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-white/80 text-gray-700 border border-gray-200 hover:bg-white"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            {t("ordersTab")}
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab("users")}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                activeTab === "users"
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-white/80 text-gray-700 border border-gray-200 hover:bg-white"
              }`}
            >
              <Users className="w-5 h-5" />
              {t("usersTab")}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Orders Tab Content */}
        {activeTab === "orders" && (
          <>
            {isLoadingOrders && (
              <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm inline-flex items-center gap-2">
                <LoaderCircle className="w-4 h-4 animate-spin" />
                {t("loadingOrders")}
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                  <h2 className="text-2xl text-gray-900">{t("uncompleted")}</h2>
                  <span className="text-sm text-gray-500">({uncompleted.length})</span>
                </div>

                <div className="space-y-4">
                  {uncompleted.length === 0 ? (
                    <div className="p-5 rounded-xl bg-white/70 border border-gray-200 text-gray-600 text-sm">
                      {t("noUncompleted")}
                    </div>
                  ) : (
                    uncompleted.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        locale={locale}
                        t={t}
                        onSelect={() => setSelectedOrder(order)}
                      />
                    ))
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="text-2xl text-gray-900">{t("completed")}</h2>
                  <span className="text-sm text-gray-500">({completed.length})</span>
                </div>

                <div className="space-y-4">
                  {completed.length === 0 ? (
                    <div className="p-5 rounded-xl bg-white/70 border border-gray-200 text-gray-600 text-sm">
                      {t("noCompleted")}
                    </div>
                  ) : (
                    completed.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        locale={locale}
                        t={t}
                        onSelect={() => setSelectedOrder(order)}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {/* Users Tab Content */}
        {activeTab === "users" && isAdmin && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-green-600" />
              <h2 className="text-2xl text-gray-900">{t("userManagement")}</h2>
              <span className="text-sm text-gray-500">({users.length})</span>
            </div>

            <UsersTable
              users={users}
              locale={locale}
              t={t}
              onUpdate={handleUpdateUser}
              isLoading={isLoadingUsers}
            />
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          locale={locale}
          t={t}
          onClose={() => setSelectedOrder(null)}
          onMarkCompleted={handleMarkCompleted}
          isMarking={isMarkingOrder}
        />
      )}
    </div>
  );
}
