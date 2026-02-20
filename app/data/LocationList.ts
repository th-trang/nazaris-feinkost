export interface Location {
  name: string;
  address: string;
  city: string;
  hours: string;
  mapUrl?: string;
  openDays: {
    day: string;
    hours: string;
  }[];
}

export const locations: Location[] = [
  { 
    name: "Norderstedt Mitte", 
    address: "Rathausallee 32",
    city: "22846 Norderstedt",
    hours: "Donnerstag 9:00 - 18:00 Uhr",
    openDays: [
      { day: "Donnerstag", hours: "9:00 - 18:00 Uhr" }
    ]
  },
  { 
    name: "Fuhlsbüttel",
    address: "Ratsmühlendamm",
    city: "Hamburg",
    hours: "Freitag 7:00 - 13:00 Uhr",
    openDays: [
      { day: "Freitag", hours: "7:00 - 13:00 Uhr" }
    ]
  },
  { 
    name: "Poppenbüttel",
    address: "Moorhof 5",
    city: "Hamburg",
    hours: "Freitag 13:30 - 18:00 Uhr",
    openDays: [
      { day: "Freitag", hours: "13:30 - 18:00 Uhr" }
    ]
  },
  { 
    name: "Sasel",
    address: "Saseler Markt",
    city: "Hamburg",
    hours: "Donnerstag: 8:00 - 13:00 Uhr, Samstag: 8:00 - 13:00 Uhr",
    openDays: [
      { day: "Donnerstag", hours: "8:00 - 13:00 Uhr" },
      { day: "Samstag", hours: "8:00 - 13:00 Uhr" }
    ]
  },
  { 
    name: "Goldbekufer",
    address: "Goldbekufer 10",
    city: "Hamburg",
    hours: "Samstag 7:00 - 13:00 Uhr",
    openDays: [
      { day: "Samstag", hours: "7:00 - 13:00 Uhr" }
    ]
  },
  { 
    name: "Langenhorn",
    address: "Langenhorn Markt",
    city: "Hamburg",
    hours: "Dienstag 11:00 - 18:00 Uhr, Samstag 7:00 - 13:00 Uhr",
    openDays: [
      { day: "Dienstag", hours: "11:00 - 18:00 Uhr" },
      { day: "Samstag", hours: "7:00 - 13:00 Uhr" }
    ]
  },
  { 
    name: "Eppendorf (Isestr.)",
    address: "Isestraße 69",
    city: "Hamburg",
    hours: "Dienstag 7:00 - 13:00 Uhr, Freitag 7:00 - 13:00 Uhr",
    openDays: [
      { day: "Dienstag", hours: "7:00 - 13:00 Uhr" },
      { day: "Freitag", hours: "7:00 - 13:00 Uhr" }
    ]
  },
  { 
    name: "Eppendorf (Bio Regional)",
    address: "Kümmellstraße 4-8",
    city: "Hamburg",
    hours: "Dienstag 7:00 - 13:00 Uhr, Freitag 7:00 - 13:00 Uhr",
    openDays: [
      { day: "Dienstag", hours: "7:00 - 13:00 Uhr" },
      { day: "Freitag", hours: "7:00 - 13:00 Uhr" }
    ]
  },
  { 
    name: "Barmbek",
    address: "Wiesendamm 3",
    city: "Hamburg",
    hours: "Freitag 13:00 - 18:00 Uhr",
    openDays: [
      { day: "Freitag", hours: "13:00 - 18:00 Uhr" }
    ]
  },
  { 
    name: "Turmweg",
    address: "Turmweg 13",
    city: "Hamburg",
    hours: "Donnerstag 7:00 - 13:00 Uhr",
    openDays: [
      { day: "Donnerstag", hours: "7:00 - 13:00 Uhr" }
    ]
  },
  { 
    name: "Rahlstedt",
    address: "Rahlstedter Bahnhofstraße",
    city: "Hamburg",
    hours: "Mittwoch 7:00 - 13:00 Uhr, Samstag 7:00 - 13:00 Uhr",
    openDays: [
      { day: "Mittwoch", hours: "7:00 - 13:00 Uhr" },
      { day: "Samstag", hours: "7:00 - 13:00 Uhr" }
    ]
  },
  { 
    name: "Immenhof",
    address: "Immenhof",
    city: "Hamburg",
    hours: "Dienstag 13:00 - 18:00 Uhr, Freitag 7:00 - 13:00 Uhr",
    openDays: [
      { day: "Dienstag", hours: "13:00 - 18:00 Uhr" },
      { day: "Freitag", hours: "7:00 - 13:00 Uhr" }
    ]
  },
  { 
    name: "Volksdorf",
    address: "Kattjahren 4",
    city: "Hamburg",
    hours: "Mittwoch 7:00 - 13:00 Uhr, Samstag 7:00 - 13:00 Uhr",
    openDays: [
      { day: "Mittwoch", hours: "7:00 - 13:00 Uhr" },
      { day: "Samstag", hours: "7:00 - 13:00 Uhr" }
    ]
  },
  { 
    name: "Winterhude (Bio Regional)",
    address: "Winterhuder Marktpl.",
    city: "Hamburg",
    hours: "Freitag 13:00 - 18:30 Uhr",
    openDays: [
      { day: "Freitag", hours: "13:00 - 18:30 Uhr" }
    ]
  },
];

// Helper function to get day name in German from a Date object
export function getDayName(date: Date): string {
  const days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  return days[date.getDay()];
}

// Helper function to get locations open on a specific date
export function getLocationsForDate(date: Date): Location[] {
  const dayName = getDayName(date);
  return locations.filter(location => 
    location.openDays.some(openDay => openDay.day === dayName)
  );
}

// Helper function to get opening hours for a location on a specific day
export function getHoursForDay(location: Location, dayName: string): string | undefined {
  const openDay = location.openDays.find(d => d.day === dayName);
  return openDay?.hours;
}