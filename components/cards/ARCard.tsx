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
  off: { body: string; action: string; hint: KeyHint };
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
  className,
}: ARCardProps) {
  return (
    <Card className={className}>
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
              <Button variant="secondary" onClick={onToggle}>
                {copy.off.action}
              </Button>
              <span className="text-caption-1 text-text-tertiary">
                <Hint hint={copy.off.hint} mono />
              </span>
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
