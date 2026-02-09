'use client';
import Link from 'next/link'; import { ShoppingCart, Globe, ChevronDown, X, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from 'next/navigation';
import logo from '@/public/logo.png';
import { useCart } from "@/app/context/CartContext";
import { useTranslations } from 'next-intl';

export default function Header() {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const { cartCount, setIsCartOpen } = useCart();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [currentHash, setCurrentHash] = useState("");
    const t = useTranslations('nav');

    const [isMobileMenuOpen, setIsMobileMenuOpen] =
        useState(false);

    const navItems = [
        { label: t('home'), path: "/home" },
        { label: t('aboutUs'), path: "/#uber-uns" },
        { label: t('menu'), path: "/menu" },
        { label: t('catering'), path: "/catering" },
        { label: t('locations'), path: "/standorte" },
    ];

    const locale = typeof params?.locale === 'string' ? params.locale : 'en';
    const homePath = `/${locale}/home`;

    useEffect(() => {
        const updateHash = () => {
            setCurrentHash(window.location.hash);
        };

        updateHash();
        window.addEventListener("hashchange", updateHash);
        return () => window.removeEventListener("hashchange", updateHash);
    }, []);

    const isActive = (path: string) => {
        if (path.startsWith("/#")) {
            return pathname === homePath && currentHash === path.substring(1);
        }
        return pathname === `/${locale}${path}`;
    };

    const handleNavClick = (path: string) => {
        if (!path.startsWith("/#")) {
            return;
        }

        if (pathname !== homePath) {
            router.push(`${homePath}${path.substring(1)}`);
            return;
        }

        const elementId = path.substring(2);
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    const language = locale.toUpperCase();

    const handleLanguageChange = (nextLocale: string) => {
        if (nextLocale === locale) {
            setShowLangMenu(false);
            return;
        }

        const segments = pathname.split("/");
        if (segments.length > 1) {
            segments[1] = nextLocale;
        }
        const nextPath = segments.join("/") || `/${nextLocale}`;
        const nextHash = typeof window !== "undefined" ? window.location.hash : "";
        router.push(`${nextPath}${nextHash}`);
        setShowLangMenu(false);
    };


    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#f7ffdf]/98 backdrop-blur-md border-b border-green-200/30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <Link href={`/${locale}/home`} className="flex items-center space-x-3 hover:scale-105 transition-transform duration-300">
                            <img src={logo.src} alt="Nazaris Feinkost" className="h-16 w-auto" />
                        </Link>

                        <div className="hidden md:flex items-center space-x-2">
                            {navItems.map((item) => {
                                const isInternal = item.path.startsWith("/#");
                                const isActiveLink = isActive(item.path);
                                const href = isInternal
                                    ? `/${locale}/home${item.path.substring(1)}`
                                    : `/${locale}${item.path}`;

                                if (isInternal) {
                                    return (
                                        <a
                                            key={item.path}
                                            href={href}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleNavClick(item.path);
                                            }}
                                            className={`relative px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ease-out group ${isActiveLink
                                                ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-600/30 scale-105"
                                                : "text-gray-700 hover:text-green-700 hover:bg-white/80 hover:shadow-md"
                                                }`}
                                        >
                                            <span className="relative z-10">{item.label}</span>
                                            {!isActiveLink && (
                                                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-50 to-green-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            )}
                                        </a>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.path}
                                        href={href}
                                        className={`relative px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ease-out group ${isActiveLink
                                            ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-600/30 scale-105"
                                            : "text-gray-700 hover:text-green-700 hover:bg-white/80 hover:shadow-md"
                                            }`}
                                    >
                                        <span className="relative z-10">{item.label}</span>
                                        {!isActiveLink && (
                                            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-50 to-green-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        )}
                                    </Link>
                                );
                            })}

                            {/* Cart Button */}
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative ml-2 p-3 text-gray-700 hover:text-green-700 hover:bg-white/80 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-110 group"
                            >
                                <ShoppingCart className="w-6 h-6 transition-transform group-hover:scale-110" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            {/* Language Switcher */}
                            <div className="relative ml-2">
                                <button
                                    onClick={() => setShowLangMenu(!showLangMenu)}
                                    onBlur={() => setTimeout(() => setShowLangMenu(false), 200)}
                                    className="flex items-center space-x-1.5 px-4 py-2.5 text-gray-700 hover:text-green-700 hover:bg-white/80 rounded-xl transition-all duration-300 hover:shadow-md group"
                                >
                                    <Globe className="w-5 h-5 transition-transform group-hover:rotate-12" />
                                    <span className="font-medium text-sm">{language}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showLangMenu ? "rotate-180" : ""}`} />
                                </button>

                                {/* Language Dropdown */}
                                <div
                                    className={`absolute right-0 mt-2 w-44 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-green-200/50 overflow-hidden transition-all duration-300 ${showLangMenu ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                                        }`}
                                >
                                    <button
                                        onClick={() => {
                                            handleLanguageChange("de");
                                        }}
                                        className={`w-full px-4 py-3 text-left transition-all duration-200 ${language === "DE"
                                            ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 font-medium"
                                            : "text-gray-700 hover:bg-green-50"
                                            }`}
                                    >
                                        <span className="flex items-center space-x-2">
                                            <span className="text-xl">🇩🇪</span>
                                            <span>Deutsch</span>
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleLanguageChange("en");
                                        }}
                                        className={`w-full px-4 py-3 text-left transition-all duration-200 ${language === "EN"
                                            ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 font-medium"
                                            : "text-gray-700 hover:bg-green-50"
                                            }`}
                                    >
                                        <span className="flex items-center space-x-2">
                                            <span className="text-xl">🇬🇧</span>
                                            <span>English</span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center space-x-2">
                            {/* Mobile Cart */}
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2 text-gray-700 hover:bg-white/80 rounded-lg transition-all"
                            >
                                <ShoppingCart className="w-6 h-6" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 rounded-lg text-gray-700 hover:bg-white/80 transition-all"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </header >

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-full sm:w-80 bg-[#f7ffdf] shadow-2xl z-50 transform transition-transform duration-300 md:hidden ${isMobileMenuOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-green-200/50">
                        <div className="flex items-center space-x-3">
                            <img
                                src={logo.src}
                                alt="Nazari"
                                className="h-12 w-auto"
                            />
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-700" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-2">
                            {navItems.map((item) => {
                                const isInternal = item.path.startsWith("/#");
                                const isActiveLink = isActive(item.path);

                                if (isInternal) {
                                    return (
                                        <a
                                            key={item.path}
                                            href={item.path}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleNavClick(item.path);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={`block px-5 py-4 rounded-xl font-medium transition-all duration-300 ${isActiveLink
                                                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg"
                                                    : "text-gray-700 hover:bg-white/80 hover:text-green-700"
                                                }`}
                                        >
                                            {item.label}
                                        </a>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.path}
                                        href={`/${locale}${item.path}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`block px-5 py-4 rounded-xl font-medium transition-all duration-300 ${isActiveLink
                                                ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg"
                                                : "text-gray-700 hover:bg-white/80 hover:text-green-700"
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Language Switcher Mobile */}
                        <div className="mt-8 pt-6 border-t border-green-200/50">
                            <div className="flex items-center space-x-2 px-2 mb-3 text-sm text-gray-600">
                                <Globe className="w-4 h-4" />
                                <span>
                                    {t('language')}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        handleLanguageChange("de");
                                    }}
                                    className={`w-full flex items-center space-x-3 px-5 py-4 rounded-xl font-medium transition-all duration-300 ${language === "DE"
                                            ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg"
                                            : "text-gray-700 hover:bg-white/80"
                                        }`}
                                >
                                    <span className="text-2xl">🇩🇪</span>
                                    <span>Deutsch</span>
                                </button>
                                <button
                                    onClick={() => {
                                        handleLanguageChange("en");
                                    }}
                                    className={`w-full flex items-center space-x-3 px-5 py-4 rounded-xl font-medium transition-all duration-300 ${language === "EN"
                                            ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg"
                                            : "text-gray-700 hover:bg-white/80"
                                        }`}
                                >
                                    <span className="text-2xl">🇬🇧</span>
                                    <span>English</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-green-200/50 p-6 bg-white/30">
                        <p className="text-center text-sm text-gray-600">
                            © 2026 Nazari
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}