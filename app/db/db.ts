import * as SQLite from "expo-sqlite";
import { Habit, HabitWithToday } from "../types";

const db = SQLite.openDatabaseSync("habits.db");

export function countCompletionsBetween(startISO: string, endISO: string): number {
  const row = db.getFirstSync<{ c: number }>(
    `SELECT COUNT(*) as c
     FROM completions
     WHERE date >= ? AND date <= ?;`,
    [startISO, endISO]
  );
  return row?.c ?? 0;
}

export function dailyCountsBetween(startISO: string, endISO: string): { date: string; c: number }[] {
  return db.getAllSync<{ date: string; c: number }>(
    `SELECT date, COUNT(*) as c
     FROM completions
     WHERE date >= ? AND date <= ?
     GROUP BY date
     ORDER BY date DESC;`,
    [startISO, endISO]
  );
}

export function updateHabit(habitId: number, name: string, emoji: string | null) {
  const cleanName = name.trim();
  if (!cleanName) return;

  db.runSync(
    `UPDATE habits
     SET name = ?, emoji = ?
     WHERE id = ?;`,
    [cleanName, emoji?.trim() || null, habitId]
  );
}

export function deleteHabit(habitId: number) {
  db.runSync(`DELETE FROM habits WHERE id = ?;`, [habitId]);
}

export function initDb() {
  db.execSync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      emoji TEXT,
      schedule_type TEXT NOT NULL,
      schedule_value TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE (habit_id, date)
    );
  `);
}

export function seedIfEmpty() {
  const row = db.getFirstSync<{ c: number }>("SELECT COUNT(*) as c FROM habits;");
  if ((row?.c ?? 0) > 0) return;

  const defaults = [
    { name: "Fajr", emoji: "🌙" },
    { name: "Dhuhr", emoji: "☀️" },
    { name: "Asr", emoji: "🕒" },
    { name: "Maghrib", emoji: "🌅" },
    { name: "Isha", emoji: "🌌" },
    { name: "Qur’an", emoji: "📖" },
    { name: "Dhikr", emoji: "🧿" },
  ];

  for (const h of defaults) {
    db.runSync(
      `INSERT INTO habits (name, emoji, schedule_type, schedule_value, is_active)
       VALUES (?, ?, 'daily', '{}', 1);`,
      [h.name, h.emoji]
    );
  }
}

export function listHabitsWithToday(dateISO: string): HabitWithToday[] {
  const rows = db.getAllSync<any>(
    `
    SELECT
      h.id, h.name, h.emoji, h.schedule_type, h.schedule_value, h.is_active,
      CASE WHEN c.id IS NULL THEN 0 ELSE 1 END AS doneToday
    FROM habits h
    LEFT JOIN completions c
      ON c.habit_id = h.id AND c.date = ?
    WHERE h.is_active = 1
    ORDER BY h.id DESC;
    `,
    [dateISO]
  );

  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    schedule_type: r.schedule_type,
    schedule_value: r.schedule_value,
    is_active: r.is_active,
    doneToday: !!r.doneToday,
  }));
}

export function toggleCompletion(habitId: number, dateISO: string) {
  // If exists -> delete, else -> insert
  const existing = db.getFirstSync<{ id: number }>(
    "SELECT id FROM completions WHERE habit_id = ? AND date = ?;",
    [habitId, dateISO]
  );

  if (existing?.id) {
    db.runSync("DELETE FROM completions WHERE id = ?;", [existing.id]);
  } else {
    db.runSync(
      "INSERT INTO completions (habit_id, date, count) VALUES (?, ?, 1);",
      [habitId, dateISO]
    );
  }
}

export function createHabit(name: string, emoji: string | null) {
  const cleanName = name.trim();
  if (!cleanName) return;

  db.runSync(
    `INSERT INTO habits (name, emoji, schedule_type, schedule_value, is_active)
     VALUES (?, ?, 'daily', '{}', 1);`,
    [cleanName, emoji?.trim() || null]
  );
}

export function listHabits(): Habit[] {
  return db.getAllSync<any>(
    `SELECT id, name, emoji, schedule_type, schedule_value, is_active
     FROM habits
     ORDER BY id DESC;`
  ) as Habit[];
}

export function countCompletionsForDate(dateISO: string): number {
  const row = db.getFirstSync<{ c: number }>(
    "SELECT COUNT(*) as c FROM completions WHERE date = ?;",
    [dateISO]
  );
  return row?.c ?? 0;
}