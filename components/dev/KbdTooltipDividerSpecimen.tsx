import { ArrowLeft, ArrowRight, SquareTerminal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { IconButton } from "@/components/ui/IconButton";
import { Kbd } from "@/components/ui/Kbd";
import { Tooltip } from "@/components/ui/Tooltip";
import { DevState } from "./DevState";

/** Kbd, Tooltip and Divider. */
export function KbdTooltipDividerSpecimen() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start gap-8">
        <DevState label="Single key">
          <Kbd>`</Kbd>
        </DevState>
        <DevState label="Shortcut">
          <Kbd>/</Kbd>
        </DevState>
        <DevState label="Named">
          <Kbd>Esc</Kbd>
        </DevState>
        <DevState label="Chord">
          <span className="inline-flex gap-2">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </DevState>
        <DevState label="Arrows">
          <span className="inline-flex gap-2">
            <Kbd>
              <ArrowLeft aria-hidden className="size-3" />
              <span className="sr-only">Left arrow</span>
            </Kbd>
            <Kbd>
              <ArrowRight aria-hidden className="size-3" />
              <span className="sr-only">Right arrow</span>
            </Kbd>
          </span>
        </DevState>
        <DevState label="Inline in a button">
          <Button variant="secondary" trailingIcon={<Kbd>/</Kbd>}>
            Ask about my work
          </Button>
        </DevState>
      </div>

      <Divider />

      <div className="flex flex-wrap items-start gap-16 pt-8">
        <DevState label="Tooltip · top · 300 ms hover / instant on focus">
          <Tooltip
            content={
              <>
                Open terminal <Kbd>`</Kbd>
              </>
            }
          >
            <IconButton aria-label="Terminal" icon={<SquareTerminal />} />
          </Tooltip>
        </DevState>
        <DevState label="Tooltip · bottom">
          <Tooltip side="bottom" content="Ask me anything">
            <Button variant="secondary" size="sm">
              Hover or Tab here
            </Button>
          </Tooltip>
        </DevState>
        <DevState label="Divider · horizontal" className="w-48">
          <Divider />
        </DevState>
        <DevState label="Divider · vertical">
          <div className="flex h-12">
            <Divider orientation="vertical" />
          </div>
        </DevState>
      </div>
    </div>
  );
}
