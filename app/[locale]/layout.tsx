import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import ClientLayout from "./ClientLayout";
import { CartProvider } from "../context/CartContext";
import { CartSidebar } from "../components/CartSidebar";
import Header from "../components/Header";

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
                <Header />
                <ClientLayout params={{ locale }}>
                    {children}
                </ClientLayout>
                <CartSidebar />
            </CartProvider>
        </NextIntlClientProvider>
    );
}