/**
 * Market open-day utilities for Nazari's Feinkost.
 *
 * Business rules:
 *  - Markets are open Tuesday–Saturday only (Sun + Mon always closed).
 *  - Hamburg (Germany) public holidays are excluded:
 *      Fixed  : New Year's Day, Labour Day, German Unity Day,
 *               Reformation Day, Christmas Day, Boxing Day.
 *      Movable: Good Friday, Easter Monday, Ascension Day, Whit Monday
 *               — computed via the Meeus/Jones/Butcher Easter algorithm,
 *                 so no hardcoded date tables are needed.
 */

// ─── Easter algorithm ──────────────────────────────────────────────────────────

/**
 * Returns Easter Sunday for `year` as a midnight-local Date.
 * Uses the Meeus/Jones/Butcher algorithm (works for any Gregorian year).
 */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// ─── Holiday computation ───────────────────────────────────────────────────────

function addDays(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

function toIsoDateString(date: Date): string {
  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, "0")}-` +
    `${String(date.getDate()).padStart(2, "0")}`
  );
}

/**
 * Returns a Set of "YYYY-MM-DD" strings for all Hamburg public holidays
 * in the given year.
 */
function hamburgHolidaysForYear(year: number): Set<string> {
  const easter = easterSunday(year);

  const holidays: Date[] = [
    // Fixed public holidays (Hamburg + nation-wide)
    new Date(year, 0, 1),   // New Year's Day       – 1 Jan
    new Date(year, 4, 1),   // Labour Day           – 1 May
    new Date(year, 9, 3),   // German Unity Day     – 3 Oct
    new Date(year, 9, 31),  // Reformation Day      – 31 Oct (Hamburg-specific)
    new Date(year, 11, 25), // Christmas Day        – 25 Dec
    new Date(year, 11, 26), // Boxing Day           – 26 Dec
    // Movable public holidays relative to Easter Sunday
    addDays(easter, -2),    // Good Friday          – Easter − 2
    addDays(easter, 1),     // Easter Monday        – Easter + 1
    addDays(easter, 39),    // Ascension Day        – Easter + 39
    addDays(easter, 50),    // Whit Monday          – Easter + 50
  ];

  return new Set(holidays.map(toIsoDateString));
}

/** Per-year cache so holidays are computed at most once per year. */
const holidayCache = new Map<number, Set<string>>();

function isHamburgHoliday(date: Date): boolean {
  const year = date.getFullYear();
  if (!holidayCache.has(year)) {
    holidayCache.set(year, hamburgHolidaysForYear(year));
  }
  return holidayCache.get(year)!.has(toIsoDateString(date));
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns `true` when the market is open on `date`.
 *
 * A date is valid when it is:
 *  - Tuesday (2), Wednesday (3), Thursday (4), Friday (5), or Saturday (6), AND
 *  - not a Hamburg public holiday.
 */
export function isMarketOpenDay(date: Date): boolean {
  const dow = date.getDay(); // 0=Sun … 6=Sat
  return dow >= 2 && !isHamburgHoliday(date);
}

/**
 * Returns the next `count` valid pickup dates as Date objects (midnight local
 * time), starting from the day *after* `startDate` (defaults to today).
 */
export function getNextBusinessDays(count: number, startDate?: Date): Date[] {
  const result: Date[] = [];
  const cursor = new Date(startDate ?? new Date());
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1); // always start from the next day

  while (result.length < count) {
    if (isMarketOpenDay(cursor)) {
      result.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

/**
 * Returns all valid pickup dates within [start, end] inclusive as Date objects
 * (midnight local time). Useful for calendar month rendering.
 */
export function getBusinessDaysInRange(start: Date, end: Date): Date[] {
  const result: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endNorm = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cursor <= endNorm) {
    if (isMarketOpenDay(cursor)) {
      result.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
