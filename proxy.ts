import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'de'];

const publicPages = [
    "/",
    "/home",
    "/catering",
    "/menu",
    "/standorte",
];

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: "de",
  localePrefix: "always",
});

export default function proxy(request: NextRequest) {
  const publicPathnameRegex = RegExp(
    `^(/(${locales.join("|")}))?(${publicPages
      .flatMap((p) => (p === "/" ? ["", "/"] : p))
      .join("|")
      .replace(/:id/g, "[^/]+")})/?$`,
    "i",
  );

  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/en/home";
    return NextResponse.redirect(url);
  }

  const localeOnlyMatch = request.nextUrl.pathname.match(/^\/(en|de)\/?$/);
  if (localeOnlyMatch) {
    const locale = localeOnlyMatch[1];
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/home`;
    return NextResponse.redirect(url);
  }

  const isPublicPage = publicPathnameRegex.test(request.nextUrl.pathname);

  if (isPublicPage) {
    return intlMiddleware(request);
  }
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
