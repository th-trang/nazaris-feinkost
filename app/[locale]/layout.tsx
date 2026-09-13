import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import ClientLayout from "./ClientLayout";
import { CartProvider } from "../context/CartContext";
import { CartSidebar } from "../components/CartSidebar";
import PromoBanner from "../components/PromoBanner";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CookieBanner } from "../components/CookieBanner";

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const messages = await getMessages({ locale });
    return (
        <NextIntlClientProvider messages={messages} locale={locale}>
            <CartProvider>
                <div className="flex flex-col min-h-screen">
                    <div className="print:hidden">
                        <PromoBanner />
                        <div aria-hidden className="h-12" />
                        <Header />
                    </div>
                    <ClientLayout params={{ locale }}>
                        <main className="flex-1">
                            {children}
                        </main>
                    </ClientLayout>
                    <div className="print:hidden">
                        <CookieBanner />
                        <Footer />
                        <CartSidebar />
                    </div>
                </div>
            </CartProvider>
        </NextIntlClientProvider>
    );
}