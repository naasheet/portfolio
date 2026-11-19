export type Theme = "dark" | "light";

/** localStorage key for the saved theme. ThemeScript reads the same key before first paint. */
export const THEME_STORAGE_KEY = "theme";

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/** The theme currently on <html>. Falls back to dark on the server or before ThemeScript runs. */
export function getTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const current = document.documentElement.dataset.theme;
  return isTheme(current) ? current : "dark";
}

/** Switch the theme: updates <html data-theme> (which restyles every token) and saves it. */
export function setTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode, disabled cookies): the theme still applies for this visit.
  }
}
