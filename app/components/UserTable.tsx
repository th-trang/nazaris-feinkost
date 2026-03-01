'use client';

import { useState } from "react";
import { LoaderCircle, Edit2, Save, XCircle, Trash2, KeyRound } from "lucide-react";    
  import {useTranslations} from "next-intl";
  import { StaffUser } from "@/app/lib/orders/types";

  
const toCreatedAtLabel = (dateStr: string | undefined | null, locale: string): string => {
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

function UserRow({
    user,
    locale,
    t,
    currentUserUid,
    onUpdate,
    onDelete,
    onResetPassword,
  }: {
    user: StaffUser;
    locale: string;
    t: ReturnType<typeof useTranslations>;
    currentUserUid: string;
    onUpdate: (uid: string, updates: {displayName?: string; email?: string; isAdmin?: boolean}) => Promise<void>;
    onDelete: (uid: string, email: string) => Promise<void>;
    onResetPassword: (uid: string) => Promise<void>;
  }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [displayName, setDisplayName] = useState(user.displayName || "");
    const [email, setEmail] = useState(user.email);
    const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  
    const handleDelete = async () => {
      if (!confirm(t("confirmDeleteUser", { email: user.email }))) return;
      setIsDeleting(true);
      try {
        await onDelete(user.uid, user.email);
      } finally {
        setIsDeleting(false);
      }
    };
  
    const handleResetPassword = async () => {
      if (!confirm(t("confirmResetPassword", { email: user.email }))) return;
      setIsResettingPassword(true);
      try {
        await onResetPassword(user.uid);
        alert(t("passwordResetSent", { email: user.email }));
      } finally {
        setIsResettingPassword(false);
      }
    };
  
    const handleSave = async () => {
      setIsSaving(true);
      try {
        await onUpdate(user.uid, {displayName, email, isAdmin});
        setIsEditing(false);
      } finally {
        setIsSaving(false);
      }
    };
  
    const handleCancel = () => {
      setDisplayName(user.displayName || "");
      setEmail(user.email);
      setIsAdmin(user.isAdmin);
      setIsEditing(false);
    };
  
    if (isEditing) {
      return (
        <tr className="bg-blue-50">
          <td className="px-4 py-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
              placeholder={t("displayName")}
            />
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
          <td className="px-4 py-3 text-sm text-gray-600">
            {toCreatedAtLabel(user.createdAt, locale)}
          </td>
          <td className="px-4 py-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{t("admin")}</span>
            </label>
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
          {user.displayName || "-"}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {toCreatedAtLabel(user.createdAt, locale)}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            {user.isAdmin && (
              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                {t("admin")}
              </span>
            )}
            {user.isStaff && (
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                {t("staff")}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex gap-1 justify-end">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title={t("edit")}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-60"
              title={t("resetPassword")}
            >
              {isResettingPassword ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            </button>
            {user.uid !== currentUserUid && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60"
                title={t("deleteUser")}
              >
                {isDeleting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

export default function UsersTable({
    users,
    locale,
    t,
    currentUserUid,
    onUpdate,
    onDelete,
    onResetPassword,
    isLoading,
  }: {
    users: StaffUser[];
    locale: string;
    t: ReturnType<typeof useTranslations>;
    currentUserUid: string;
    onUpdate: (uid: string, updates: {displayName?: string; email?: string; isAdmin?: boolean}) => Promise<void>;
    onDelete: (uid: string, email: string) => Promise<void>;
    onResetPassword: (uid: string) => Promise<void>;
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
                  {t("displayName")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("email")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("createdAt")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("role")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <UserRow
                  key={user.uid}
                  user={user}
                  locale={locale}
                  t={t}
                  currentUserUid={currentUserUid}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onResetPassword={onResetPassword}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }