"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type ImgProps = {
  /** A static import (blur comes for free) or a URL string (pass blurDataURL for a blur). */
  src: StaticImageData | string;
  alt: string;
  /** Intrinsic size. Required, so the frame reserves its space and nothing shifts. */
  width: number;
  height: number;
  /** Tiny image shown blurred while loading. Defaults to the static import's own. */
  blurDataURL?: string;
  /** Responsive sizes hint for next/image, e.g. "(min-width: 1024px) 33vw, 100vw". */
  sizes?: string;
  /** Load eagerly with high priority: only for the largest image above the fold. */
  priority?: boolean;
  /** Classes for the frame (sizing, radius). */
  className?: string;
  /** Classes for the <img> itself (e.g. object-position). */
  imgClassName?: string;
};

/**
 * next/image in a frame that holds the aspect ratio from width / height, paints a blurred
 * placeholder, and fades the real image in over 300 ms once it has loaded. The loaded flag is
 * a data attribute set on the frame directly, so loading never re-renders.
 * Without a blur source the frame shows the glass surface colour instead.
 */
export function Img({
  src,
  alt,
  width,
  height,
  blurDataURL,
  sizes,
  priority = false,
  className,
  imgClassName,
}: ImgProps) {
  const frame = useRef<HTMLDivElement>(null);
  const blur =
    blurDataURL ?? (typeof src === "string" ? undefined : src.blurDataURL);

  const markLoaded = () => {
    if (frame.current) frame.current.dataset.loaded = "";
  };

  // An image that finished loading before hydration never fires onLoad for React.
  useEffect(() => {
    const img = frame.current?.querySelector("img");
    if (img?.complete && img.naturalWidth > 0) markLoaded();
  }, [src]);

  const style = {
    aspectRatio: `${width} / ${height}`,
    ...(blur ? { "--img-blur": `url("${blur}")` } : {}),
  } as CSSProperties;

  return (
    <div
      ref={frame}
      className={cn("img-frame block w-full", className)}
      style={style}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        placeholder="empty"
        onLoad={markLoaded}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
    </div>
  );
}
