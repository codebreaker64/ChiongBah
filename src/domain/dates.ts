/** A calendar date as 'YYYY-MM-DD'. */
export type LocalDate = string;

const SINGAPORE_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8, no daylight saving
const DAY_MS = 24 * 60 * 60 * 1000;

function parts(date: LocalDate): [number, number, number] {
  const [y, m, d] = date.split('-').map(Number);
  return [y, m, d];
}

function toUtcMs(date: LocalDate): number {
  const [y, m, d] = parts(date);
  return Date.UTC(y, m - 1, d);
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** Returns the date if `input` is a real calendar date in YYYY-MM-DD form, else null. */
export function parseLocalDate(input: string): LocalDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/** Today's date in Singapore for the given instant. */
export function todayInSingapore(now: Date): LocalDate {
  const sg = new Date(now.getTime() + SINGAPORE_OFFSET_MS);
  return `${pad(sg.getUTCFullYear(), 4)}-${pad(sg.getUTCMonth() + 1)}-${pad(sg.getUTCDate())}`;
}

/** Calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** Age in whole years on the date `on`. A 29 Feb birthday counts from 1 Mar in non-leap years. */
export function ageOn(dob: LocalDate, on: LocalDate): number {
  const [by, bm, bd] = parts(dob);
  const [y, m, d] = parts(on);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age -= 1;
  return age;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-10-01' → '1 Oct 2026' */
export function formatLocalDate(date: LocalDate): string {
  const [y, m, d] = parts(date);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
