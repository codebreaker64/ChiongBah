/** Index i holds the SQL that moves the schema to version i + 1. Never edit a released entry; add a new one. */
export const migrations: string[] = [
  `
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    dob TEXT NOT NULL,
    status TEXT NOT NULL,
    service TEXT NOT NULL,
    elite_vocation INTEGER NOT NULL,
    ord_rod_date TEXT,
    ippt_date TEXT
  );
  CREATE TABLE goal (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    target_kind TEXT NOT NULL,
    target_value TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station TEXT NOT NULL,
    source TEXT NOT NULL,
    started_at TEXT NOT NULL,
    valid_count INTEGER,
    no_count_form INTEGER,
    no_count_unclear INTEGER,
    run_time_s INTEGER,
    run_distance_m INTEGER,
    adjusted INTEGER NOT NULL DEFAULT 0,
    external_id TEXT,
    rule_config_version TEXT,
    model_version TEXT
  );
  CREATE INDEX sessions_station_started ON sessions (station, started_at);
  `,
];
