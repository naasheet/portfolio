"use client";

import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { colorTransition, disabledState, focusRing } from "./controlStyles";

type Common = {
  label: string;
  /** Shown under the field in danger red; sets aria-invalid and aria-describedby. */
  error?: string;
  /** A line under the field on the left (e.g. "71 / 2000"), and one on the right. */
  hint?: ReactNode;
  hintEnd?: ReactNode;
  className?: string;
};

export type TextFieldProps = Common &
  (
    | ({ multiline?: false } & Omit<
        ComponentPropsWithoutRef<"input">,
        "className"
      >)
    | ({ multiline: true } & Omit<
        ComponentPropsWithoutRef<"textarea">,
        "className"
      >)
  );

const FIELD =
  "w-full rounded-control border border-border-default bg-bg-base px-4 text-body text-text-primary placeholder:text-text-tertiary hover:border-text-tertiary aria-[invalid=true]:border-status-danger";

/**
 * A labelled text input or textarea (4.7, the contact sheet): 56 px tall (a textarea grows from
 * 176 px), an error line under it in danger red (announced through aria-describedby), and an
 * optional hint row (a counter, "Esc to close"). Same focus ring as every control.
 */
export function TextField(props: TextFieldProps) {
  const generated = useId();
  const { label, error, hint, hintEnd, className, multiline, ...field } = props;
  const id = field.id ?? generated;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;
  const shared = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  } as const;

  const control = multiline ? (
    <textarea
      {...(field as ComponentPropsWithoutRef<"textarea">)}
      {...shared}
      data-lenis-prevent
      className={cn(
        FIELD,
        "min-h-44 resize-y py-3",
        colorTransition,
        focusRing,
        disabledState,
      )}
    />
  ) : (
    <input
      {...(field as ComponentPropsWithoutRef<"input">)}
      {...shared}
      className={cn(FIELD, "h-14", colorTransition, focusRing, disabledState)}
    />
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-subhead text-text-secondary">
        {label}
      </label>
      {control}
      {error ? (
        <p id={errorId} className="text-footnote text-status-danger">
          {error}
        </p>
      ) : null}
      {hint || hintEnd ? (
        <div className="flex items-center justify-between gap-4 text-caption-1 text-text-tertiary">
          <span id={hintId} className="font-mono tabular-nums">
            {hint}
          </span>
          {hintEnd ? <span aria-hidden>{hintEnd}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
