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