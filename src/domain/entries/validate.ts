export type Parsed<T> = { ok: true; value: T } | { ok: false; error: 'format' | 'range' };

export const REPS_RANGE = { min: 0, max: 100 };
export const RUN_RANGE_SECONDS = { min: 7 * 60, max: 25 * 60 };

/** Whole number of reps, 0–100. */
export function validateReps(input: string): Parsed<number> {
  const text = input.trim();
  if (!/^\d+$/.test(text)) return { ok: false, error: 'format' };
  const value = Number(text);
  if (value < REPS_RANGE.min || value > REPS_RANGE.max) return { ok: false, error: 'range' };
  return { ok: true, value };
}

/** 'm:ss' or 'mm:ss' → seconds, 7:00–25:00. */
export function parseRunTime(input: string): Parsed<number> {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(input.trim());
  if (!match) return { ok: false, error: 'format' };
  const value = Number(match[1]) * 60 + Number(match[2]);
  if (value < RUN_RANGE_SECONDS.min || value > RUN_RANGE_SECONDS.max) return { ok: false, error: 'range' };
  return { ok: true, value };
}

export function formatRunTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
