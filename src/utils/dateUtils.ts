import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

/** Calculate duration in days (inclusive): differenceInDays(end, start) + 1 */
export function calculateDuration(start: Date, end: Date): number {
  const startDay = dayjs.utc(start).startOf('day');
  const endDay = dayjs.utc(end).startOf('day');
  return endDay.diff(startDay, 'day') + 1;
}

/** Format a date to DDMMYY (e.g., "170226" for 17 Feb 2026) */
export function formatDateToDDMMYY(date: Date): string {
  const d = dayjs.utc(date);
  return d.format('DDMMYY');
}

/** Check if two date ranges overlap: [aStart, aEnd] and [bStart, bEnd] */
export function datesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/** Check if a date falls within [start, end] inclusive */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = dayjs.utc(date).startOf('day');
  const s = dayjs.utc(start).startOf('day');
  const e = dayjs.utc(end).startOf('day');
  return (d.isSame(s) || d.isAfter(s)) && (d.isSame(e) || d.isBefore(e));
}

/** Normalize a date string (YYYY-MM-DD) or Date to midnight UTC */
export function normalizeToDate(input: string | Date): Date {
  return dayjs.utc(input).startOf('day').toDate();
}

/** Zero-pad a number to 2 digits */
export function zeroPad(n: number): string {
  return n.toString().padStart(2, '0');
}
