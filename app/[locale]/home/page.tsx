'use client';
import { MapPin, Users, Star } from "lucide-react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function HomePage() {
  const t = useTranslations('home');
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'de';
  
  const testimonials = [
    {
      name: "Anna",
      location: "Vegan",
      text: t('testimonial1'),
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    },
    {
      name: "Peter",
      location: "Vegan",
      text: t('testimonial2'),
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen pt-[50px]">
      {/* Hero Section - Wochenmarkt */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200">
                <MapPin className="w-4 h-4 text-green-700" />
                <span className="text-sm text-gray-700">{t('freshFromMarket')}</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl tracking-tight text-gray-900">
                {t('weeklyMarket')}
              </h1>
              
              <p className="text-lg text-gray-700 leading-relaxed max-w-xl">
                {t('heroDescription')}
              </p>

              <Link
                href={`/${locale}/standorte`}
                className="inline-flex items-center px-8 py-4 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {t('toLocations')}
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="http://www.nazarifeinkost.de/wp-content/uploads/2021/06/IMG_1439.JPG.jpg"
                  alt="Wochenmarkt Stand"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Über Uns Section */}
      <section id="uber-uns" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="http://www.nazarifeinkost.de/wp-content/uploads/2021/06/IMG_0286.jpg"
                  alt="Frisches Gemüse"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200">
                <Star className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-gray-700">{t('since1992')}</span>
              </div>

              <h2 className="text-4xl lg:text-5xl tracking-tight text-gray-900">
                {t('aboutUs')}
              </h2>

              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>{t('aboutText1')}</p>
                <p>{t('aboutText2')}</p>
                <p>{t('aboutText3')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Das Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">{t('ourTeam')}</span>
              </div>

              <h2 className="text-4xl lg:text-5xl tracking-tight text-gray-900">
                {t('theTeam')}
              </h2>

              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>{t('teamText1')}</p>
                <p>{t('teamText2')}</p>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="http://www.nazarifeinkost.de/wp-content/uploads/2021/04/IMG_1523.JPG-2048x1365.jpg"
                  alt="Unser Team"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
              <Star className="w-8 h-8 text-amber-600 fill-amber-600" />
            </div>
            <h2 className="text-4xl lg:text-5xl tracking-tight text-gray-900 mb-4">
              {t('customerReviews')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md"
                  />
                  <div>
                    <h3 className="text-gray-900">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.location}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic leading-relaxed">
                  "{testimonial.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-600">Nazari 2014 · All Rights Reserved</p>
            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">{t('imprint')}</a>
              <a href="#" className="hover:text-gray-900 transition-colors">{t('privacy')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
