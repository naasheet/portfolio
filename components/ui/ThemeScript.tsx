import { routeTable } from "@/content/chapters";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const KEY = JSON.stringify(THEME_STORAGE_KEY);

/*
 * Runs before first paint: saved theme, else the OS preference, else dark.
 * Kept as plain ES5 so it needs no bundling and runs in any browser.
 */
const applyTheme = `(function(){var d=document.documentElement;try{var t=localStorage.getItem(${KEY});if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}d.dataset.theme=t}catch(e){d.dataset.theme="dark"}})();`;

/*
 * R.1: html[data-page] from the URL, before first paint, so the static nav shell shows the
 * right island label on a reload. The table is content/chapters.ts's routeTable as JSON, and
 * RouteWatcher uses the same table on client navigation, so CSS and React never disagree.
 * Same rule as pageFromPath(): exact route, or deeper for nested pages; otherwise "none".
 */
const applyPage = `(function(){var r=${JSON.stringify(routeTable)},p=location.pathname,i,e,id="none";if(p.length>1&&p.charAt(p.length-1)==="/")p=p.slice(0,-1);for(i=0;i<r.length;i++){e=r[i];if(p===e[1]||(e[2]&&p.indexOf(e[1]+"/")===0)){id=e[0];break}}document.documentElement.dataset.page=id})();`;

/*
 * Dev only: exposes setTheme('light' | 'dark') in the console, mirroring setTheme() in
 * lib/theme.ts (same attribute and key). Not shipped to production.
 */
const devHelper = `window.setTheme=function(t){document.documentElement.dataset.theme=t;try{localStorage.setItem(${KEY},t)}catch(e){}};`;

const script =
  applyTheme +
  applyPage +
  (process.env.NODE_ENV === "production" ? "" : devHelper);

/**
 * The one inline <head> theme / page script: sets data-theme and data-page before the page
 * paints, so neither flashes. <html> keeps suppressHydrationWarning for both attributes.
 */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
