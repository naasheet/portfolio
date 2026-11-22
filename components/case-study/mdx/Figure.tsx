import { Img } from "@/components/media/Img";
import { cn } from "@/lib/utils";

export type FigureProps = {
  /** A file under public/ (or an imported image's URL). */
  src: string;
  /** What the image shows, for screen readers. */
  alt: string;
  /** Intrinsic size, so the frame reserves its space. Default 1600 × 1000. */
  width?: number;
  height?: number;
  caption?: string;
  className?: string;
};

/** A screenshot or diagram with an optional caption (4.5; Case study frames). */
export function Figure({
  src,
  alt,
  width = 1600,
  height = 1000,
  caption,
  className,
}: FigureProps) {
  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div className="overflow-hidden rounded-card border border-border-default bg-surface-glass">
        <Img
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(min-width: 1024px) 720px, 100vw"
        />
      </div>
      {caption ? (
        <figcaption className="text-caption-1 text-text-tertiary">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
