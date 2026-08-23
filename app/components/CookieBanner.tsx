'use client'
import { useState, useEffect } from "react";
import { Cookie, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

const STORAGE_KEY = "nazari-cookie-consent";

type ConsentState = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<ConsentState>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) setVisible(true);
  }, []);

  const save = (consent: ConsentState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    setVisible(false);
  };

  const acceptAll = () => save({ essential: true, analytics: true, marketing: true });
  const rejectAll = () => save({ essential: true, analytics: false, marketing: false });
  const savePrefs = () => save(prefs);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-6"
    >
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

        {/* Main row */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Cookie className="w-5 h-5 text-amber-600" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Wir verwenden Cookies
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Wir setzen Cookies ein, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten.
                Technisch notwendige Cookies sind immer aktiv.{" "}
                <Link href="/datenschutz" className="text-green-700 underline hover:text-green-800 transition-colors">
                  Datenschutzerklärung
                </Link>
              </p>
            </div>

            <button
              onClick={rejectAll}
              className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Expandable preferences */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Einstellungen anpassen
          </button>

          {expanded && (
            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              {/* Essential — always on */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Notwendig</p>
                  <p className="text-xs text-gray-500 mt-0.5">Warenkorb, Session, Sicherheit — immer aktiv</p>
                </div>
                <div className="w-11 h-6 bg-green-600 rounded-full relative cursor-not-allowed opacity-70">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Analyse</p>
                  <p className="text-xs text-gray-500 mt-0.5">Hilft uns, die Website zu verbessern</p>
                </div>
                <button
                  onClick={() => setPrefs((p) => ({ ...p, analytics: !p.analytics }))}
                  className={`w-11 h-6 rounded-full relative transition-colors ${prefs.analytics ? "bg-green-600" : "bg-gray-300"}`}
                  aria-checked={prefs.analytics}
                  role="switch"
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${prefs.analytics ? "right-1" : "left-1"}`} />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Marketing</p>
                  <p className="text-xs text-gray-500 mt-0.5">Für personalisierte Inhalte und Angebote</p>
                </div>
                <button
                  onClick={() => setPrefs((p) => ({ ...p, marketing: !p.marketing }))}
                  className={`w-11 h-6 rounded-full relative transition-colors ${prefs.marketing ? "bg-green-600" : "bg-gray-300"}`}
                  aria-checked={prefs.marketing}
                  role="switch"
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${prefs.marketing ? "right-1" : "left-1"}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          {expanded ? (
            <>
              <button
                onClick={rejectAll}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Alle ablehnen
              </button>
              <button
                onClick={savePrefs}
                className="px-5 py-2.5 text-sm font-semibold text-green-700 border-2 border-green-600 rounded-xl hover:bg-green-50 transition-colors"
              >
                Auswahl speichern
              </button>
              <button
                onClick={acceptAll}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
              >
                Alle akzeptieren
              </button>
            </>
          ) : (
            <>
              <button
                onClick={rejectAll}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Nur notwendige
              </button>
              <button
                onClick={acceptAll}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
              >
                Alle akzeptieren
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
