import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PromoBanner() {
  const t = useTranslations("banner");

  return (
    <div className="fixed top-0 inset-x-0 z-[60] border-b border-amber-200/40 bg-gradient-to-r from-amber-500 via-green-600 to-emerald-600 text-white shadow-lg shadow-emerald-900/10">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium sm:text-sm">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="truncate">{t("message")}</span>
        </div>
      </div>
    </div>
  );
}