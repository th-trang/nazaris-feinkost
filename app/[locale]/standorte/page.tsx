"use client";

import { Clock, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslations } from 'next-intl';

export default function StandortePage() {
  const [selectedLocation, setSelectedLocation] = useState(0);
  const t = useTranslations('locations');

  const locations = [
    { 
      name: "Norderstedt Mitte", 
      address: "Rathausallee 32",
      city: "22846 Norderstedt",
      hours: "Donnerstag 9:00 - 18:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde",
    },
    { 
      name: "Fuhlsbüttel",
      address: "Ratsmühlendamm",
      city: "Hamburg",
      hours: "Freitag 7:00 - 13:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
    { 
      name: "Poppenbüttel",
      address: "Moorhof 5",
      city: "Hamburg",
      hours: "Freitag 13:30 - 18:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
    { 
      name: "Sasel",
      address: "Saseler Markt",
      city: "Hamburg",
      hours: "Donnerstag: 8:00 - 13:00 Uhr, Samstag: 8:00 - 13:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
    { 
      name: "Goldbekufer",
      address: "Goldbekufer 10",
      city: "Hamburg",
      hours: "Samstag 7:00 - 13:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
    { 
      name: "Langenhorn",
      address: "Langenhorn Markt",
      city: "Hamburg",
      hours: "Dienstag 11:00 - 18:00 Uhr, Samstag 7:00 - 13:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
    { 
      name: "Eppendorf (Isestr.)",
      address: "Isestraße 69",
      city: "Hamburg",
      hours: "Dienstag 7:00 - 13:00 Uhr, Freitag 7:00 - 13:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
    { 
      name: "Eppendorf (Bio Regional)",
      address: "Kümmellstraße 4-8",
      city: "Hamburg",
      hours: "Dienstag 7:00 - 13:00 Uhr, Freitag 7:00 - 13:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
    { 
      name: "Barmbek",
      address: "Wiesendamm 3",
      city: "Hamburg",
      hours: "Freitag 13:00 - 18:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
    { 
      name: "Turmweg",
      address: "Turmweg 13",
      city: "Hamburg",
      hours: "Donnerstag 7:00 - 13:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
    { 
      name: "Rahlstedt",
      address: "Rahlstedter Bahnhofstraße",
      city: "Hamburg",
      hours: "Mittwoch 7:00 - 13:00 Uhr, Samstag 7:00 - 13:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
    { 
      name: "Immenhof",
      address: "Immenhof",
      city: "Hamburg",
      hours: "Dienstag 13:00 - 18:00 Uhr, Freitag 7:00 - 13:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
    { 
      name: "Volksdorf",
      address: "Kattjahren 4",
      city: "Hamburg",
      hours: "Mittwoch 7:00 - 13:00 Uhr, Samstag 7:00 - 13:00 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
    { 
      name: "Winterhude (Bio Regional)",
      address: "Winterhuder Marktpl.",
      city: "Hamburg",
      hours: "Freitag 13:00 - 18:30 Uhr",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.5487786642447!2d10.003774315779487!3d53.69685698004613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b18f1e1e1e1e1f%3A0x1e1e1e1e1e1e1e1e!2sRathausallee%2032%2C%2022846%20Norderstedt!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
    },
  ];

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