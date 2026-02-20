"use client";

import { Clock, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslations } from 'next-intl';
import { locations } from "@/app/data/LocationList";

export default function StandortePage() {
  const [selectedLocation, setSelectedLocation] = useState(0);
  const t = useTranslations('locations');

  const selected = locations[selectedLocation];
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    `${selected.address} ${selected.city}`
  )}&output=embed`;

  return (
    <div className="min-h-screen pt-[50px]">
      {/* Main Content */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Introduction */}
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl text-gray-900 mb-6">
              {t('title')}
            </h1>
            <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
              {t('description')}
            </p>
          </div>

          {/* Location Dropdown */}
          <div className="max-w-2xl mx-auto mb-12">
            <label htmlFor="location-select" className="block text-lg text-gray-700 mb-3">
              {t('selectLocation')}
            </label>
            <div className="relative">
              <select
                id="location-select"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(Number(e.target.value))}
                className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-xl text-lg text-gray-900 appearance-none cursor-pointer hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-4 focus:ring-green-100 transition-all shadow-sm"
              >
                {locations.map((location, index) => (
                  <option key={index} value={index}>
                    {location.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Map & Location Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 lg:p-8 shadow-xl border border-gray-100">
            {/* Map */}
            <div className="aspect-video bg-gray-200 rounded-2xl mb-6 overflow-hidden shadow-lg">
              <iframe
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${selected.name} Map`}
              ></iframe>
            </div>

            {/* Selected Location Details */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 lg:p-8 text-white shadow-lg">
              <h2 className="text-3xl mb-6">{selected.name}</h2>
              
              <div className="flex items-start space-x-3">
                <Clock className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-lg mb-1">{t('openingHours')}</p>
                  <p className="text-green-100 text-lg">{selected.hours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}