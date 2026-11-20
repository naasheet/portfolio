import type { StaticImageData } from "next/image";
import { cn } from "@/lib/utils";
import { Img } from "./Img";

export type AvatarSize = "sm" | "md" | "lg";

const PX: Record<AvatarSize, number> = { sm: 40, md: 56, lg: 72 };
const FRAME: Record<AvatarSize, string> = {
  sm: "size-10",
  md: "size-14",
  lg: "size-18",
};
const INITIALS: Record<AvatarSize, string> = {
  sm: "text-footnote",
  md: "text-title-3",
  lg: "text-title-2",
};

export type AvatarProps = {
  /** Shown when there's no photo (always hidden from screen readers). */
  initials: string;
  /**
   * Who it is: the photo's alt text, or a hidden label for the initials. Omit it when the name
   * is already visible next to the avatar: the avatar is then decorative.
   */
  name?: string;
  photo?: { src: StaticImageData | string; blurDataURL?: string };
  size?: AvatarSize;
  className?: string;
};

/** A round photo, or initials in accent on the solid surface, as on the ProfileCard. */
export function Avatar({
  initials,
  name,
  photo,
  size = "md",
  className,
}: AvatarProps) {
  const px = PX[size];
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-chip border border-border-default bg-surface-solid text-accent-primary",
        FRAME[size],
        className,
      )}
    >
      {photo ? (
        <Img
          src={photo.src}
          blurDataURL={photo.blurDataURL}
          alt={name ?? ""}
          width={px}
          height={px}
          sizes={`${px}px`}
          className="size-full"
        />
      ) : (
        <>
          <span aria-hidden className={INITIALS[size]}>
            {initials}
          </span>
          {name ? <span className="sr-only">{name}</span> : null}
        </>
      )}
    </span>
  );
}
