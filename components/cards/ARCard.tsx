"use client";

import { ArrowRight, Hand } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { focusRing } from "@/components/ui/controlStyles";
import { Kbd } from "@/components/ui/Kbd";
import { StatusChip } from "@/components/ui/StatusChip";
import { CardEyebrow } from "./CardEyebrow";
import { IconTile } from "./IconTile";

export type ARState = "off" | "on" | "blocked";

/** A sentence with a key or command in the middle: "Press [Esc] to stop.", "or type [ar on]". */
export type KeyHint = { before: string; key: string; after?: string };

export type ARCardCopy = {
  title: string;
  /** `hint` is optional: the About frame shows the button alone. */
  off: { body: string; action: string; hint?: KeyHint };
  on: { chip: string; body: string; hint: KeyHint; action: string };
  blocked: { chip: string; body: string; help: string };
};

export type ARCardProps = {
  state: ARState;
  copy: ARCardCopy;
  /** Turns AR on or off. Static for now; the AR phase wires it to the store. */
  onToggle?: () => void;
  /** Page explaining how to allow the camera. */
  helpHref: string;
  /** Optional eyebrow above the title. */
  eyebrow?: string;
  /**
   * The phone row (4.3, About phone frame): the hand tile, the title and a short line, and an
   * arrow; the whole row is the toggle (off state only).
   */
  compact?: { body: string };
  /** The card hover look without being clickable (4.3; Card `hoverable`). */
  hoverable?: boolean;
  className?: string;
};

function Hint({ hint, mono }: { hint: KeyHint; mono?: boolean }) {
  return (
    <>
      {hint.before}{" "}
      {mono ? (
        <code className="font-mono text-text-primary">{hint.key}</code>
      ) : (
        <Kbd>{hint.key}</Kbd>
      )}
      {hint.after ? ` ${hint.after}` : null}
    </>
  );
}

/** The AR invitation in its three states: off, on (tracking) and camera blocked. */
export function ARCard({
  state,
  copy,
  onToggle,
  helpHref,
  eyebrow,
  compact,
  hoverable = false,
  className,
}: ARCardProps) {
  if (compact && state === "off") {
    return (
      <Card interactive className={className}>
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center gap-4 text-left outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-border-focus"
        >
          <IconTile>
            <Hand />
          </IconTile>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-headline">{copy.title}</span>
            <span className="text-footnote text-text-secondary">{compact.body}</span>
          </span>
          <ArrowRight aria-hidden className="size-4 shrink-0 text-text-secondary" />
        </button>
      </Card>
    );
  }
  return (
    <Card hoverable={hoverable} className={className}>
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <IconTile>
            <Hand />
          </IconTile>
          {state === "on" ? (
            <StatusChip tone="live">{copy.on.chip}</StatusChip>
          ) : state === "blocked" ? (
            <StatusChip tone="error">{copy.blocked.chip}</StatusChip>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          {eyebrow ? <CardEyebrow>{eyebrow}</CardEyebrow> : null}
          <h3 className="text-headline">{copy.title}</h3>
          <p className="text-footnote text-text-secondary">
            {state === "on" ? (
              <>
                {copy.on.body} <Hint hint={copy.on.hint} />
              </>
            ) : (
              copy[state].body
            )}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-4">
          {state === "off" ? (
            <>
              <Button variant="secondary" leadingIcon={<Hand />} onClick={onToggle}>
                {copy.off.action}
              </Button>
              {copy.off.hint ? (
                <span className="text-caption-1 text-text-tertiary">
                  <Hint hint={copy.off.hint} mono />
                </span>
              ) : null}
            </>
          ) : state === "on" ? (
            <Button variant="secondary" onClick={onToggle}>
              {copy.on.action}
            </Button>
          ) : (
            // A wrapping text link (as drawn), not a Button: Buttons never wrap.
            <Link
              href={helpHref}
              className={`group/help inline-flex items-center gap-2 rounded-control text-subhead font-semibold text-text-primary transition-colors duration-150 ease-out hover:text-accent-primary ${focusRing}`}
            >
              {copy.blocked.help}
              <ArrowRight
                aria-hidden
                className="size-4 shrink-0 transition-transform duration-250 ease-out group-hover/help:translate-x-1"
              />
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
