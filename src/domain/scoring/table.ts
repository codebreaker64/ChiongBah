export type Station = 'pushup' | 'situp' | 'run';
export const STATIONS: Station[] = ['pushup', 'situp', 'run'];

export type AgeBand = { id: string; minAge: number; maxAge: number };
/** Rows are ordered best first. */
export type RepRow = { minReps: number; points: number };
/** Rows are ordered best first. */
export type RunRow = { maxSeconds: number; points: number };

export type ScoringTable = {
  id: string;
  source: string;
  retrievedOn: string;
  ageBands: AgeBand[];
  pushup: Record<string, RepRow[]>;
  situp: Record<string, RepRow[]>;
  run: Record<string, RunRow[]>;
};

export const MAX_POINTS: Record<Station, number> = { pushup: 25, situp: 25, run: 50 };

/** Returns a list of problems; empty when the table is usable. */
export function validateTable(t: ScoringTable): string[] {
  const errors: string[] = [];
  const bands = [...t.ageBands].sort((a, b) => a.minAge - b.minAge);
  bands.forEach((band, i) => {
    if (band.maxAge < band.minAge) errors.push(`band ${band.id}: maxAge below minAge`);
    const next = bands[i + 1];
    if (next && next.minAge !== band.maxAge + 1) {
      errors.push(`bands ${band.id} and ${next.id} ${next.minAge <= band.maxAge ? 'overlap' : 'leave a gap'}`);
    }
  });

  for (const band of t.ageBands) {
    for (const station of STATIONS) {
      const rows: (RepRow | RunRow)[] | undefined = t[station][band.id];
      const where = `${station}/${band.id}`;
      if (!rows || rows.length === 0) {
        errors.push(`${where}: missing`);
        continue;
      }
      if (rows[0].points !== MAX_POINTS[station]) errors.push(`${where}: top row is not ${MAX_POINTS[station]} points`);
      rows.forEach((row, i) => {
        if (row.points < 1) errors.push(`${where} row ${i}: points below 1`);
        if (i === 0) return;
        const prev = rows[i - 1];
        if (row.points >= prev.points) errors.push(`${where} row ${i}: points not decreasing`);
        const better = station === 'run'
          ? (row as RunRow).maxSeconds > (prev as RunRow).maxSeconds
          : (row as RepRow).minReps < (prev as RepRow).minReps;
        if (!better) errors.push(`${where} row ${i}: rows not ordered best first`);
      });
    }
  }
  return errors;
}

export function bandForAge(t: ScoringTable, age: number): AgeBand | null {
  return t.ageBands.find((b) => age >= b.minAge && age <= b.maxAge) ?? null;
}

/** Points for a result: reps for push-ups and sit-ups, seconds for the run. */
export function stationPoints(t: ScoringTable, bandId: string, station: Station, result: number): number {
  if (station === 'run') {
    return t.run[bandId].find((row) => result <= row.maxSeconds)?.points ?? 0;
  }
  return t[station][bandId].find((row) => result >= row.minReps)?.points ?? 0;
}
