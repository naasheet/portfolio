"use client";

import { Moon, Sun } from "lucide-react";
import { useStore } from "@/lib/store";

/** Dev-page theme switch. Goes through the store, so the saved theme updates too. */
export function ThemeToggle() {
  const mode = useStore((s) => s.theme.mode);
  const toggle = useStore((s) => s.theme.toggleMode);
  const next = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      className="inline-flex items-center gap-2 rounded-control border border-border-default bg-surface-solid px-4 py-2 text-subhead transition-[transform,border-color] duration-150 ease-out hover:border-border-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus active:scale-[0.97]"
    >
      {mode === "dark" ? (
        <Moon size={16} aria-hidden />
      ) : (
        <Sun size={16} aria-hidden />
      )}
      <span>{mode === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
