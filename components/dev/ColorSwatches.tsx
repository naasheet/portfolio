"use client";

import { useMemo } from "react";
import { useDomTheme } from "./useDomTheme";

const SKIP = new Set(["--color-transparent", "--color-current"]);

/** Every colour token declared in the loaded stylesheets, in source order. */
function findColorTokens(): string[] {
  const names = new Set<string>();

  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        for (const prop of Array.from(rule.style)) {
          if (
            (prop.startsWith("--color-") || prop === "--glass-fill") &&
            !SKIP.has(prop)
          ) {
            names.add(prop);
          }
        }
      }
      if (rule instanceof CSSGroupingRule) walk(rule.cssRules);
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules);
    } catch {
      // Cross-origin stylesheet: not ours, skip it.
    }
  }
  return [...names];
}

type Swatch = { name: string; value: string };

/**
 * Swatches for every colour token, discovered at runtime so new tokens appear without
 * editing this file. Values are the computed ones for the current theme.
 */
export function ColorSwatches() {
  const theme = useDomTheme();

  const swatches = useMemo<Swatch[]>(() => {
    if (!theme) return [];
    const root = getComputedStyle(document.documentElement);
    return findColorTokens().map((name) => ({
      name,
      value: root.getPropertyValue(name).trim(),
    }));
  }, [theme]);

  if (!theme) {
    return <div className="h-64 rounded-card bg-surface-glass" aria-hidden />;
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {swatches.map(({ name, value }) => (
        <li key={name} className="flex flex-col gap-2">
          {/* Checkerboard behind each swatch, so translucent fills read as translucent. */}
          <div className="h-16 overflow-hidden rounded-control border border-border-default bg-[repeating-conic-gradient(var(--color-border-default)_0_25%,transparent_0_50%)] bg-size-[16px_16px]">
            <div
              className="h-full w-full"
              style={{ background: `var(${name})` }}
            />
          </div>
          <div className="flex flex-col">
            <code className="text-caption-1 font-mono break-all text-text-primary">
              {name.replace(/^--color-/, "")}
            </code>
            <code className="text-caption-2 font-mono text-text-tertiary">
              {value}
            </code>
          </div>
        </li>
      ))}
    </ul>
  );
}
