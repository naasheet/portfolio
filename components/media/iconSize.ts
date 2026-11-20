/**
 * Icon sizes for lucide-react: pass ICON_SIZE.md to `size`, or use ICON_CLASS.md where the size
 * is set with a class (e.g. on an svg inside a control). 16 / 20 / 24 px.
 */
export const ICON_SIZE = { sm: 16, md: 20, lg: 24 } as const;

export const ICON_CLASS = { sm: "size-4", md: "size-5", lg: "size-6" } as const;

export type IconSize = keyof typeof ICON_SIZE;
