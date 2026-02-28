export interface LocationCatalogItem {
  id: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  openDays: Array<{
    day: string;
    hours: string;
  }>;
}

export const locationCatalog: LocationCatalogItem[] = [
  {
    id: "norderstedt-mitte",
    name: "Norderstedt Mitte",
    address: "Rathausallee 32",
    city: "22846 Norderstedt",
    hours: "Donnerstag 9:00 - 18:00 Uhr",
    openDays: [{day: "Donnerstag", hours: "9:00 - 18:00 Uhr"}],
  },
  {
    id: "fuhlsbuettel",
    name: "Fuhlsbüttel",
    address: "Ratsmühlendamm",
    city: "Hamburg",
    hours: "Freitag 7:00 - 13:00 Uhr",
    openDays: [{day: "Freitag", hours: "7:00 - 13:00 Uhr"}],
  },
  {
    id: "poppenbuettel",
    name: "Poppenbüttel",
    address: "Moorhof 5",
    city: "Hamburg",
    hours: "Freitag 13:30 - 18:00 Uhr",
    openDays: [{day: "Freitag", hours: "13:30 - 18:00 Uhr"}],
  },
  {
    id: "sasel",
    name: "Sasel",
    address: "Saseler Markt",
    city: "Hamburg",
    hours: "Donnerstag: 8:00 - 13:00 Uhr, Samstag: 8:00 - 13:00 Uhr",
    openDays: [
      {day: "Donnerstag", hours: "8:00 - 13:00 Uhr"},
      {day: "Samstag", hours: "8:00 - 13:00 Uhr"},
    ],
  },
  {
    id: "goldbekufer",
    name: "Goldbekufer",
    address: "Goldbekufer 10",
    city: "Hamburg",
    hours: "Samstag 7:00 - 13:00 Uhr",
    openDays: [{day: "Samstag", hours: "7:00 - 13:00 Uhr"}],
  },
  {
    id: "langenhorn",
    name: "Langenhorn",
    address: "Langenhorn Markt",
    city: "Hamburg",
    hours: "Dienstag 11:00 - 18:00 Uhr, Samstag 7:00 - 13:00 Uhr",
    openDays: [
      {day: "Dienstag", hours: "11:00 - 18:00 Uhr"},
      {day: "Samstag", hours: "7:00 - 13:00 Uhr"},
    ],
  },
  {
    id: "eppendorf-isestr",
    name: "Eppendorf (Isestr.)",
    address: "Isestraße 69",
    city: "Hamburg",
    hours: "Dienstag 7:00 - 13:00 Uhr, Freitag 7:00 - 13:00 Uhr",
    openDays: [
      {day: "Dienstag", hours: "7:00 - 13:00 Uhr"},
      {day: "Freitag", hours: "7:00 - 13:00 Uhr"},
    ],
  },
  {
    id: "eppendorf-bio-regional",
    name: "Eppendorf (Bio Regional)",
    address: "Kümmellstraße 4-8",
    city: "Hamburg",
    hours: "Dienstag 7:00 - 13:00 Uhr, Freitag 7:00 - 13:00 Uhr",
    openDays: [
      {day: "Dienstag", hours: "7:00 - 13:00 Uhr"},
      {day: "Freitag", hours: "7:00 - 13:00 Uhr"},
    ],
  },
  {
    id: "barmbek",
    name: "Barmbek",
    address: "Wiesendamm 3",
    city: "Hamburg",
    hours: "Freitag 13:00 - 18:00 Uhr",
    openDays: [{day: "Freitag", hours: "13:00 - 18:00 Uhr"}],
  },
  {
    id: "turmweg",
    name: "Turmweg",
    address: "Turmweg 13",
    city: "Hamburg",
    hours: "Donnerstag 7:00 - 13:00 Uhr",
    openDays: [{day: "Donnerstag", hours: "7:00 - 13:00 Uhr"}],
  },
  {
    id: "rahlstedt",
    name: "Rahlstedt",
    address: "Rahlstedter Bahnhofstraße",
    city: "Hamburg",
    hours: "Mittwoch 7:00 - 13:00 Uhr, Samstag 7:00 - 13:00 Uhr",
    openDays: [
      {day: "Mittwoch", hours: "7:00 - 13:00 Uhr"},
      {day: "Samstag", hours: "7:00 - 13:00 Uhr"},
    ],
  },
  {
    id: "immenhof",
    name: "Immenhof",
    address: "Immenhof",
    city: "Hamburg",
    hours: "Dienstag 13:00 - 18:00 Uhr, Freitag 7:00 - 13:00 Uhr",
    openDays: [
      {day: "Dienstag", hours: "13:00 - 18:00 Uhr"},
      {day: "Freitag", hours: "7:00 - 13:00 Uhr"},
    ],
  },
  {
    id: "volksdorf",
    name: "Volksdorf",
    address: "Kattjahren 4",
    city: "Hamburg",
    hours: "Mittwoch 7:00 - 13:00 Uhr, Samstag 7:00 - 13:00 Uhr",
    openDays: [
      {day: "Mittwoch", hours: "7:00 - 13:00 Uhr"},
      {day: "Samstag", hours: "7:00 - 13:00 Uhr"},
    ],
  },
  {
    id: "winterhude-bio-regional",
    name: "Winterhude (Bio Regional)",
    address: "Winterhuder Marktpl.",
    city: "Hamburg",
    hours: "Freitag 13:00 - 18:30 Uhr",
    openDays: [{day: "Freitag", hours: "13:00 - 18:30 Uhr"}],
  },
];
