"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import logo from "@/public/logo.png";

export default function Footer() {
  const t = useTranslations("footer");
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "de";
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto">
      {/* Wave divider */}
      <div className="overflow-hidden leading-none">
        <svg
          viewBox="0 0 1440 48"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full block"
          preserveAspectRatio="none"
        >
          <path
            d="M0,32 C360,0 1080,64 1440,16 L1440,48 L0,48 Z"
            fill="#f7ffdf"
          />
        </svg>
      </div>

      {/* Footer body */}
      <div
        style={{
          background: "#f7ffdf",
        }}
        className="text-[#7c7d15]"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">

            {/* Brand */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-3">
                <div className="w-28 h-28 flex items-center justify-center overflow-hidden">
                  <Image
                    src={logo}
                    alt="Nazari's Feinkost"
                    width={104}
                    height={104}
                    className="object-contain"
                  />
                </div>
                <span className="text-xl font-semibold tracking-wide">
                  Nazari&apos;s Feinkost
                </span>
              </div>
              {/* <p className="text-green-100 text-sm text-center md:text-left max-w-xs">
                {t("tagline")}
              </p> */}
            </div>

            {/* Links */}
            <div className="flex flex-col items-center md:items-end gap-3">
              <nav className="flex gap-6 text-sm">
                <Link
                  href={`/${locale}/impressum`}
                  className="text-gray-800 hover:text-green-600 transition-colors underline-offset-4"
                >
                  {t("imprint")}
                </Link>
                <Link
                  href={`/${locale}/datenschutz`}
                  className="text-gray-800 hover:text-green-600 transition-colors underline-offset-4"
                >
                  {t("privacy")}
                </Link>
              </nav>
              <p className="text-gray-800 text-xs">
                {t("copyright", { year })}
              </p>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
