import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const SGT = 'Asia/Singapore';

/** Calculate duration in days (inclusive): differenceInDays(end, start) + 1 */
export function calculateDuration(start: Date, end: Date): number {
  const startDay = dayjs(start).tz(SGT).startOf('day');
  const endDay = dayjs(end).tz(SGT).startOf('day');
  return endDay.diff(startDay, 'day') + 1;
}

/** Format a date to DDMMYY (e.g., "170226" for 17 Feb 2026) */
export function formatDateToDDMMYY(date: Date): string {
  return dayjs(date).tz(SGT).format('DDMMYY');
}

/** Check if two date ranges overlap: [aStart, aEnd] and [bStart, bEnd] */
export function datesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/** Check if a date falls within [start, end] inclusive */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = dayjs(date).tz(SGT).startOf('day');
  const s = dayjs(start).tz(SGT).startOf('day');
  const e = dayjs(end).tz(SGT).startOf('day');
  return (d.isSame(s) || d.isAfter(s)) && (d.isSame(e) || d.isBefore(e));
}

/** Normalize a date string (YYYY-MM-DD) or Date to midnight SGT, returned as a UTC Date */
export function normalizeToSGTDate(input: string | Date): Date {
  return dayjs(input).tz(SGT).startOf('day').toDate();
}

/** True if the given SGT time (or current SGT clock if omitted) is within the EX_STAY_IN book-in window (0800–2000) */
export function isExStayInInCamp(at?: { hour: number; minute: number }): boolean {
  const sgt = at ?? { hour: dayjs().tz(SGT).hour(), minute: dayjs().tz(SGT).minute() };
  const totalMinutes = sgt.hour * 60 + sgt.minute;
  return totalMinutes >= 8 * 60 && totalMinutes < 20 * 60;
}

/** Zero-pad a number to 2 digits */
export function zeroPad(n: number): string {
  return n.toString().padStart(2, '0');
}
