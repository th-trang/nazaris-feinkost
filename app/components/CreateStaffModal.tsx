'use client';

import { useTranslations } from "next-intl";
import { CreateStaffUserInput } from "../lib/orders/types";
import { useState } from "react";

import { LoaderCircle, X } from "lucide-react";

export default  function CreateStaffModal({
    t,
    onClose,
    onCreate,
  }: {
    t: ReturnType<typeof useTranslations>;
    onClose: () => void;
    onCreate: (input: CreateStaffUserInput) => Promise<void>;
  }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
  
      if (!email.trim() || !password.trim()) {
        setError(t("emailPasswordRequired"));
        return;
      }
  
      if (password.length < 6) {
        setError(t("passwordTooShort"));
        return;
      }
  
      setIsCreating(true);
      try {
        await onCreate({
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined,
          isAdmin,
        });
        onClose();
      } catch {
        setError(t("createUserError"));
      } finally {
        setIsCreating(false);
      }
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
          <div className="border-b border-gray-100 p-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{t("addStaffUser")}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
  
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t("email")} *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
  
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t("password")} *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">{t("minPassword")}</p>
            </div>
  
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t("displayName")}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
  
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{t("makeAdmin")}</span>
              </label>
            </div>
  
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
  
            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                  {t("creating")}
                </>
              ) : (
                t("createUser")
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }