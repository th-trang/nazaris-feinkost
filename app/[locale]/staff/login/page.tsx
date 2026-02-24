"use client";

import {FormEvent, useEffect, useState} from "react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {LoaderCircle, Lock} from "lucide-react";
import {useTranslations} from "next-intl";
import {signInWithEmailAndPassword} from "firebase/auth";
import {getFirebaseAuth, isFirebaseConfigured} from "@/app/lib/firebase/client";
import {isStaffUser, watchAuthUser} from "@/app/lib/firebase/auth";

export default function StaffLoginPage() {
  const t = useTranslations("staffLogin");
  const params = useParams();
  const router = useRouter();
  const locale = typeof params?.locale === "string" ? params.locale : "de";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsCheckingSession(false);
      return;
    }

    const unsubscribe = watchAuthUser((user) => {
      void (async () => {
        if (!user) {
          setIsCheckingSession(false);
          return;
        }

        const hasStaffAccess = await isStaffUser(user);
        if (hasStaffAccess) {
          router.replace(`/${locale}/staff/orders`);
          return;
        }

        setIsCheckingSession(false);
      })();
    });

    return () => {
      unsubscribe();
    };
  }, [locale, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isFirebaseConfigured) {
      setError(t("configMissing"));
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      );

      const hasStaffAccess = await isStaffUser(result.user);
      if (!hasStaffAccess) {
        setError(t("noStaffAccess"));
        return;
      }

      router.replace(`/${locale}/staff/orders`);
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 pt-26">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-3xl text-gray-900 mt-4">{t("title")}</h1>
          <p className="text-gray-700 mt-2">{t("description")}</p>
        </div>

        {isCheckingSession ? (
          <div className="py-8 text-center">
            <LoaderCircle className="w-8 h-8 animate-spin text-green-600 mx-auto" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-2">
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </button>

            <Link
              href={`/${locale}/staff/orders`}
              className="block text-sm text-green-700 text-center hover:underline"
            >
              {t("goToOrders")}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
