/**
 * The loading line's tiny spinner: the cursor's dot with three specks circling it (one amber).
 * CSS rotation only while the gate is up; still under reduced motion (.gate-orbit in globals.css).
 */
export function OrbitSpinner() {
  return (
    <span
      aria-hidden
      className="relative inline-flex size-4 shrink-0 items-center justify-center"
    >
      <span className="size-1.5 rounded-chip bg-accent-primary shadow-[0_0_6px_var(--color-accent-primary)]" />
      <span className="gate-orbit absolute inset-0">
        <span className="absolute top-0 left-1/2 size-[3px] -translate-x-1/2 rounded-chip bg-accent-primary" />
        <span className="absolute right-[1px] bottom-[2px] size-[3px] rounded-chip bg-accent-primary" />
        <span className="absolute bottom-[2px] left-[1px] size-[3px] rounded-chip bg-accent-secondary" />
      </span>
    </span>
  );
}
