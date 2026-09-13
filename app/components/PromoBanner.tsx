"use client";

import { useEffect, useState } from "react";

const BANNER_MESSAGES = [
  "Neu: [Produktname] — jetzt entdecken",
  "Ab 50 € Bestellwert: 10% Rabatt",
  "Ab 100 € Bestellwert: 15% Rabatt",
];

export default function PromoBanner() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIsVisible(false);

      window.setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % BANNER_MESSAGES.length);
        setIsVisible(true);
      }, 250);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-[60] w-full border-b border-amber-200/40 bg-gradient-to-r from-amber-500 via-green-600 to-emerald-600 text-white shadow-lg shadow-emerald-900/10">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full text-center text-xs font-medium sm:text-sm">
          <span
            className={`block whitespace-nowrap transition-opacity duration-300 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {BANNER_MESSAGES[messageIndex]}
          </span>
        </div>
      </div>
    </div>
  );
}