/*
 * Guards for browser-only APIs. Everything here is safe to call during server rendering
 * and never throws: storage can be blocked (private mode, disabled cookies, quota).
 */

export const isBrowser = typeof window !== "undefined";

export const storage = {
  /** The stored string, or null when missing, on the server, or when storage is blocked. */
  get(key: string): string | null {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  /** Store a string. Returns false when it couldn't be saved. */
  set(key: string, value: string): boolean {
    if (!isBrowser) return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Blocked storage: nothing to remove.
    }
  },
};
