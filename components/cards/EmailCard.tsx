"use client";

import { ArrowUpRight, Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colorTransition, focusRing } from "@/components/ui/controlStyles";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { CardEyebrow } from "./CardEyebrow";

const COPIED_MS = 2000;

export type EmailCardProps = {
  eyebrow: string;
  email: string;
  labels: {
    copy: string;
    copied: string;
    openMail: string;
    /** The island alert after copying ("Email copied"). */
    copiedAlert: string;
    /** The error toast when the clipboard refuses. */
    copyFailed: string;
  };
  hoverable?: boolean;
  className?: string;
};

/**
 * The email address with a Copy button (clipboard; "✓ Copied" for 2 s and an island alert) and
 * "Open mail app ↗" (mailto) (4.7, Contact frames). Phones: the address with Copy beside it.
 */
export function EmailCard({
  eyebrow,
  email,
  labels,
  hoverable,
  className,
}: EmailCardProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast(labels.copiedAlert);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      toast(labels.copyFailed, { kind: "error" });
    }
  };

  return (
    <Card
      hoverable={hoverable}
      className={cn("flex flex-col gap-4 md:justify-between", className)}
    >
      <CardEyebrow mono>{eyebrow}</CardEyebrow>
      <div className="flex items-center justify-between gap-4 md:flex-col md:items-start md:gap-6">
        <p className="min-w-0 truncate text-callout font-mono text-text-primary select-all md:text-title-3 md:font-mono">
          {email}
        </p>
        <div className="flex shrink-0 items-center gap-2 md:gap-6">
          <Button
            variant="secondary"
            onClick={copyEmail}
            leadingIcon={
              copied ? <Check /> : <Copy className="hidden md:block" />
            }
            aria-live="polite"
          >
            {copied ? labels.copied : labels.copy}
          </Button>
          <a
            href={`mailto:${email}`}
            className={cn(
              "hidden h-11 items-center gap-2 rounded-control px-2 text-subhead text-text-secondary hover:text-text-primary md:inline-flex",
              colorTransition,
              focusRing,
            )}
          >
            {labels.openMail}
            <ArrowUpRight aria-hidden className="size-4" />
          </a>
        </div>
      </div>
    </Card>
  );
}
