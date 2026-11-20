/*
 * Classes that fake a pointer state on /dev, so every state shows side by side like the
 * component sheet. CSS can't force :hover or :active, and the components deliberately
 * take no "force state" prop. Keep these in sync with the components' hover classes.
 */
export const forced = {
  focus: "outline-2 outline-offset-2 outline-border-focus",
  pressed: "scale-[0.97]",
  primaryHover: "bg-accent-primary-hover",
  secondaryHover: "border-text-tertiary bg-surface-glass",
  ghostHover: "bg-surface-glass",
  iconHover: "border-text-tertiary bg-surface-glass",
  chipHover: "border-text-tertiary text-text-primary",
  chipSelectedHover: "bg-accent-primary/25",
} as const;
