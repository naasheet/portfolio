const SHADOWS = [
  { name: "shadow-lift", className: "shadow-lift", use: "Hovered card" },
  {
    name: "shadow-overlay",
    className: "shadow-overlay",
    use: "Solid overlays",
  },
] as const;

/** Each shadow on a glass card (blur 24 px, hairline border, glass fill) over a busy backdrop. */
export function ShadowSpecimen() {
  return (
    <div className="grid gap-8 rounded-card bg-[radial-gradient(circle_at_20%_30%,var(--color-accent-primary),transparent_45%),radial-gradient(circle_at_80%_70%,var(--color-accent-secondary),transparent_45%)] p-8 sm:grid-cols-2">
      {SHADOWS.map(({ name, className, use }) => (
        <div
          key={name}
          className={`${className} flex h-32 flex-col justify-end gap-1 rounded-card border border-border-default bg-glass-fill p-6 backdrop-blur-glass`}
        >
          <code className="text-caption-1 font-mono">{name}</code>
          <span className="text-footnote text-text-secondary">{use}</span>
        </div>
      ))}
    </div>
  );
}
