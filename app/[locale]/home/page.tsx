'use client';
import { MapPin, Users, Star, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion } from "motion/react";

export default function HomePage() {
  const t = useTranslations('home');
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'de';
  
  const fadeUp = (delay = 0) => ({
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  });

  // const HERO_IMAGE    = "https://images.unsplash.com/photo-1768812910769-d037b90aee77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
  // const UBER_UNS_IMG  = "https://images.unsplash.com/photo-1589926195968-5ec48a3ec91d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
  // const ORDER_IMG     = "https://images.unsplash.com/photo-1717163059480-5594e1dbe10b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";


  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── 1. Hero — what we do ── */}
      <section className="relative min-h-screen flex items-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-[700px] h-[700px] bg-green-200/25 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-200/20 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto w-full py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div className="space-y-8">
              <motion.p
                variants={fadeUp(0)} initial="hidden" animate="visible"
                className="text-sm font-semibold uppercase tracking-widest text-green-700"
              >
                {t('heroTagline')}
              </motion.p>

              <motion.h1
                variants={fadeUp(0.1)} initial="hidden" animate="visible"
                className="text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.05]"
              >
                {t('heroTitleLine1')}
                <span className="block text-green-700">{t('heroTitleLine2')}</span>
                <span className="block">{t('heroTitleLine3')}</span>
              </motion.h1>

              <motion.p
                variants={fadeUp(0.2)} initial="hidden" animate="visible"
                className="text-xl text-gray-600 leading-relaxed max-w-lg"
              >
                {t('heroSubtitle')}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                <img src={""} alt={t('heroImgAlt')} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-amber-300/20 rounded-full blur-3xl -z-10" />
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-green-300/20 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. Über Uns → Standorte ── */}
      <section id="uber-uns" className="py-28 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <motion.div
              variants={fadeUp(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img src={""} alt={t('aboutImgAlt')} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-5 -right-5 w-48 h-48 bg-amber-300/15 rounded-full blur-3xl -z-10" />
            </motion.div>

            <div className="space-y-7">
              <motion.div variants={fadeUp(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <p className="text-sm font-semibold uppercase tracking-widest text-green-700 mb-4">{t('aboutUs')}</p>
                <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
                  {t('aboutHeading')}
                </h2>
              </motion.div>

              <motion.blockquote
                variants={fadeUp(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="border-l-4 border-green-500 pl-5 italic text-gray-600 text-lg leading-relaxed"
              >
                "{t('aboutText3')}"
              </motion.blockquote>

              <motion.div
                variants={fadeUp(0.2)} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="space-y-4 text-gray-600 leading-relaxed"
              >
                <p>{t('aboutPara1')}</p>
                <p>{t('aboutPara2')}</p>
              </motion.div>

              <motion.div variants={fadeUp(0.3)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Link
                  href="/standorte"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all shadow-md hover:shadow-lg font-semibold group"
                >
                  <MapPin className="w-4 h-4" />
                  {t('discoverLocations')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Online Bestellen ── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden shadow-2xl min-h-[520px] flex items-center"
          >
            <div className="absolute inset-0">
                <img src={""} alt={t('orderImgAlt')} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/70 to-gray-900/20" />
            </div>

            <div className="relative px-10 lg:px-16 py-16 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-green-400 mb-5">
                {t('orderSectionLabel')}
              </p>
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                {t('orderHeading')}
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                {t('orderDescription')}
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-full hover:bg-green-500 transition-colors shadow-lg font-semibold group"
              >
                <ShoppingBag className="w-5 h-5" />
                {t('orderNow')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 4. Das Team ── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div className="space-y-7">
              <motion.div variants={fadeUp(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <p className="text-sm font-semibold uppercase tracking-widest text-green-700 mb-4">{t('theTeam')}</p>
                <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
                  {t('teamHeading')}
                </h2>
              </motion.div>

              <motion.div
                variants={fadeUp(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="space-y-4 text-gray-600 leading-relaxed"
              >
                <p>{t('teamPara1')}</p>
                <p>{t('teamPara2')}</p>
              </motion.div>
            </div>

            <motion.div
              variants={fadeUp(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img src={""} alt={t('teamImgAlt')} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-5 -left-5 w-48 h-48 bg-green-300/15 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
