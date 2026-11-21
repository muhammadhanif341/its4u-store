import type { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS, type Settings } from "./constants";

const KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

/** Pure: merge stored rows over the defaults, ignoring unknown keys and blank values. */
export function mergeSettings(rows: { key: string; value: string }[]): Settings {
  const merged: Settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if ((KEYS as string[]).includes(row.key) && row.value.trim() !== "") {
      merged[row.key as keyof Settings] = row.value;
    }
  }
  return merged;
}

export async function getSettings(db: PrismaClient): Promise<Settings> {
  const rows = await db.setting.findMany();
  return mergeSettings(rows);
}

export async function saveSettings(db: PrismaClient, values: Partial<Settings>): Promise<void> {
  for (const key of KEYS) {
    const value = values[key];
    if (typeof value !== "string") continue;
    await db.setting.upsert({
      where: { key },
      update: { value: value.trim() },
      create: { key, value: value.trim() },
    });
  }
}
