import type { ScoringTable } from '../table';

/**
 * The official scoring table the app scores with.
 * null until the official MINDEF tables are transcribed (plan Task 6); screens show
 * "Scoring tables not added yet." instead of points while it is null.
 */
export let currentTable: ScoringTable | null = null;
