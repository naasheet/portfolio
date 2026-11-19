const RADII = [
  { name: "rounded-card", className: "rounded-card", value: "24px" },
  { name: "rounded-control", className: "rounded-control", value: "12px" },
  { name: "rounded-chip", className: "rounded-chip", value: "full" },
] as const;

export function RadiusSpecimen() {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {RADII.map(({ name, className, value }) => (
        <li key={name} className="flex flex-col gap-2">
          <div
            className={`${className} flex h-24 items-center justify-center border border-border-default bg-surface-glass`}
          >
            <span className="text-subhead text-text-secondary">{value}</span>
          </div>
          <code className="text-caption-1 font-mono">{name}</code>
        </li>
      ))}
    </ul>
  );
}
