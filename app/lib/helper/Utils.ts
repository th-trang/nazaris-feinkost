export const toDateLabel = (date: string, locale: string): string => {
    if (!date) {
      return "-";
    }
  
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }
  
    return parsed.toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      weekday: "short",
    });
  };
  
  export const toCurrency = (value: number, currency: string, locale: string): string => {
    return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
      style: "currency",
      currency: currency || "EUR",
    }).format(value);
  };

/**
 * Returns true if the given pickup date is at least 5 business days (Mon–Fri)
 * from today. Required to enable SEPA debit as a payment option.
 */
export function isSepaAllowedForPickupDate(pickupDateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pickupDate = new Date(pickupDateStr + "T00:00:00");
  pickupDate.setHours(0, 0, 0, 0);

  let businessDays = 0;
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() + 1); // start counting from tomorrow

  while (cursor <= pickupDate) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) { // Mon–Fri only
      businessDays++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return businessDays >= 5;
}
/**
 * The calendar day a timestamp falls on, in the viewer's timezone, as
 * `YYYY-MM-DD`.
 *
 * Order timestamps are stored as UTC ISO strings, so slicing the first ten
 * characters would file a 00:30 Hamburg order under the previous day. Going
 * through the local getters keeps "placed on the 5th" meaning the shop's day.
 */
export const toLocalIsoDate = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};
