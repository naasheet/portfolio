import { THEME_STORAGE_KEY } from "@/lib/theme";

const KEY = JSON.stringify(THEME_STORAGE_KEY);

/*
 * Runs before first paint: saved theme, else the OS preference, else dark.
 * Kept as plain ES5 so it needs no bundling and runs in any browser.
 */
const applyTheme = `(function(){var d=document.documentElement;try{var t=localStorage.getItem(${KEY});if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}d.dataset.theme=t}catch(e){d.dataset.theme="dark"}})();`;

/*
 * Dev only: exposes setTheme('light' | 'dark') in the console, mirroring setTheme() in
 * lib/theme.ts (same attribute and key). Not shipped to production.
 */
const devHelper = `window.setTheme=function(t){document.documentElement.dataset.theme=t;try{localStorage.setItem(${KEY},t)}catch(e){}};`;

const script =
  process.env.NODE_ENV === "production" ? applyTheme : applyTheme + devHelper;

/** Inline <head> script that sets data-theme before the page paints, so it never flashes. */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
