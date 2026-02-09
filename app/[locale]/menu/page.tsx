'use client';

import { useTranslations } from 'next-intl';

export default function Menu() {
    const t = useTranslations('menu');
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-6xl font-bold">{t('title')}</h1>
        </div>
    );
}