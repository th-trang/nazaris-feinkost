"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import { ClipboardList, Lock, LoaderCircle, RefreshCw, Users, CheckCircle, Plus } from "lucide-react";
import {useTranslations} from "next-intl";
import {watchAuthUser, isStaffUser, isAdminUser} from "@/app/lib/firebase/auth";
import {signOut} from "firebase/auth";
import {getFirebaseAuth} from "@/app/lib/firebase/client";
import {getStaffOrders, markOrderCompleted, getStaffUsers, updateStaffUser, createStaffUser, deleteStaffUser, resetStaffUserPassword} from "@/app/lib/firebase/orders";
import {StaffOrder, StaffUser, CreateStaffUserInput} from "@/app/lib/orders/types";
import UsersTable from "@/app/components/UserTable";
import CreateStaffModal from "@/app/components/CreateStaffModal";
import OrderDetailModal from "@/app/components/OrderDetailModal";
import OrderCard from "@/app/components/OrderCard";

type AccessState = "checking" | "unauthenticated" | "forbidden" | "authorized";
type Tab = "orders" | "users";

export default function StaffOrdersPage() {
  const t = useTranslations("staffOrders");
  const params = useParams();
  const router = useRouter();
  const locale = typeof params?.locale === "string" ? params.locale : "de";

  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState("");
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
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  const canLoadOrders = useMemo(() => accessState === "authorized", [accessState]);

  const loadOrders = useCallback(async () => {
    if (!canLoadOrders) return;

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
    if (!canLoadOrders || !isAdmin) return;
    

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
    if (!selectedOrder) return;

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

  const handleUpdateUser = async (uid: string, updates: {displayName?: string; email?: string; isAdmin?: boolean}) => {
    try {
      await updateStaffUser({
        uid,
        displayName: updates.displayName,
        email: updates.email,
        isAdmin: updates.isAdmin,
      });
      await loadUsers();
    } catch {
      setError(t("updateUserError"));
    }
  };

  const handleCreateUser = async (input: CreateStaffUserInput) => {
    await createStaffUser(input);
    await loadUsers();
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    try {
      await deleteStaffUser(uid);
      await loadUsers();
    } catch {
      setError(t("deleteUserError"));
    }
  };

  const handleResetPassword = async (uid: string) => {
    try {
      await resetStaffUserPassword(uid);
    } catch {
      setError(t("resetPasswordError"));
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
        if (!mounted) return;

        if (!user) {
          setAccessState("unauthenticated");
          return;
        }

        try {
          const staff = await isStaffUser(user);
          if (!mounted) return;
          
          if (!staff) {
            setAccessState("forbidden");
            return;
          }

          const admin = await isAdminUser(user);
          if (!mounted) {
            return;
          }
          
          setIsAdmin(admin);
          setCurrentUserUid(user.uid);
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
    if (accessState !== "authorized") return;


    void loadOrders();
  }, [accessState, loadOrders]);

  useEffect(() => {
    if (accessState !== "authorized" || !isAdmin || activeTab !== "users") return;

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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <h2 className="text-2xl text-gray-900">{t("userManagement")}</h2>
                <span className="text-sm text-gray-500">({users.length})</span>
              </div>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t("addStaffUser")}
              </button>
            </div>

            <UsersTable
              users={users}
              locale={locale}
              t={t}
              currentUserUid={currentUserUid}
              onUpdate={handleUpdateUser}
              onDelete={handleDeleteUser}
              onResetPassword={handleResetPassword}
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

      {/* Create Staff User Modal */}
      {showCreateUserModal && (
        <CreateStaffModal
          t={t}
          onClose={() => setShowCreateUserModal(false)}
          onCreate={handleCreateUser}
        />
      )}
    </div>
  );
}
