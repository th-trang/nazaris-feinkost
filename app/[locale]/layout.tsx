import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import ClientLayout from "./ClientLayout";
import { CartProvider } from "../context/CartContext";
import { CartSidebar } from "../components/CartSidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
                    <Header />
                    <ClientLayout params={{ locale }}>
                        <main className="flex-1">
                            {children}
                        </main>
                    </ClientLayout>
                    <Footer />
                    <CartSidebar />
                </div>
            </CartProvider>
        </NextIntlClientProvider>
    );
}