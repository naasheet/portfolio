/*
 * The site's secrets (R.5): small easter eggs the visitor can find, remembered in localStorage
 * ("secrets", a JSON list of ids). The plant is the first; copy.home.secrets.total says how many
 * there are in all.
 */
import { storage } from "./browser";

const KEY = "secrets";

export type SecretId = "plant";

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(storage.get(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function hasSecret(id: SecretId): boolean {
  return read().includes(id);
}

/** Mark `id` found. Returns how many secrets are found now, or null if it already was. */
export function findSecret(id: SecretId): number | null {
  const found = read();
  if (found.includes(id)) return null;
  found.push(id);
  storage.set(KEY, JSON.stringify(found));
  return found.length;
}
