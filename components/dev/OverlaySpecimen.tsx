"use client";

import { ArrowRight, Terminal } from "lucide-react";
import { useState } from "react";
import { Drawer } from "@/components/overlay/Drawer";
import { Modal } from "@/components/overlay/Modal";
import { Sheet } from "@/components/overlay/Sheet";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

/*
 * Mirrors the Overlays board (stuff/reference/Overlays (chunk 1.5)@2x.png). The content inside
 * each overlay is placeholder: chunk 1.5 builds the frames only.
 */

const SKELETON = ["w-11/12", "w-10/12", "w-11/12", "w-7/12"];

const LONG = Array.from(
  { length: 10 },
  (_, i) =>
    `[Placeholder paragraph ${i + 1}. Long enough to scroll inside the sheet body while the header and footer stay put and the page behind never moves.]`,
);

function TerminalLine({ cmd }: { cmd?: string }) {
  return (
    <p>
      <span className="text-accent-primary">nasheet@portfolio:~$</span>{" "}
      {cmd ? (
        <span className="text-text-primary">{cmd}</span>
      ) : (
        <span className="terminal-cursor inline-block h-3.5 w-2 translate-y-0.5 bg-accent-secondary" />
      )}
    </p>
  );
}

/** Opens each overlay as drawn on the board, plus the three toast kinds. */
export function OverlaySpecimen() {
  const [sheet, setSheet] = useState(false);
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <Button variant="secondary" onClick={() => setSheet(true)}>
          Open sheet
        </Button>
        <Button variant="secondary" onClick={() => setModal(true)}>
          Open modal
        </Button>
        <Button variant="secondary" onClick={() => setDrawer(true)}>
          Open drawer
        </Button>
      </div>
      <div className="flex flex-wrap gap-4">
        <Button variant="ghost" onClick={() => toast("Email copied")}>
          Success toast
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            toast("Sound is off", {
              kind: "info",
              action: { label: "Undo", onClick: () => toast("Sound is on") },
            })
          }
        >
          Info + Undo
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            toast("Couldn't reach the server", {
              kind: "error",
              action: {
                label: "Retry",
                onClick: () => toast("Sent", { kind: "success" }),
              },
            })
          }
        >
          Error + Retry
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            for (let i = 1; i <= 5; i++) toast(`Burst ${i} of 5`);
          }}
        >
          Five at once (max three)
        </Button>
      </div>
      <p className="text-footnote text-text-tertiary">
        Esc closes the topmost overlay; a backdrop click closes the sheet and
        drawer but not the modal (it asks to confirm). Focus returns to the
        button that opened it. Toasts sit bottom-right (bottom-centre on
        phones); hover or Tab into the stack to spread it out. Below 768 px the
        sheet is a bottom sheet: drag its handle down.
      </p>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        eyebrow="Case study"
        title="[Sheet title]"
        closeLabel="Close sheet"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSheet(false)}>
              Close
            </Button>
            <Button
              trailingIcon={<ArrowRight />}
              onClick={() => setModal(true)}
            >
              Read the full case study
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div
            aria-hidden
            className="aspect-[16/9] rounded-control bg-linear-to-br from-accent-primary/40 to-accent-secondary/30"
          />
          <p className="text-subhead text-text-secondary">
            [Content goes here. The sheet only provides the frame: header,
            scrolling body and a sticky footer. The primary button opens a modal
            on top, to test nesting.]
          </p>
          <div aria-hidden className="flex flex-col gap-2">
            {SKELETON.map((w, i) => (
              <span
                key={i}
                className={`h-2 rounded-chip bg-surface-glass ${w}`}
              />
            ))}
          </div>
          {LONG.map((p) => (
            <p key={p} className="text-subhead text-text-secondary">
              {p}
            </p>
          ))}
          <a
            href="#overlays"
            className="text-subhead text-accent-primary underline"
          >
            [A link at the end]
          </a>
        </div>
      </Sheet>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="[Modal title]"
        description="[One or two lines that say what this dialog is for and what happens next.]"
        closeLabel="Close dialog"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModal(false);
                toast("Confirmed");
              }}
            >
              Confirm
            </Button>
          </>
        }
      />

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        icon={<Terminal />}
        title="Terminal"
        escHint="close"
        closeLabel="Close terminal"
      >
        <div className="flex flex-col gap-2 text-footnote font-mono text-text-secondary">
          <TerminalLine cmd="help" />
          <p>
            30 commands. Try <span className="text-text-primary">play</span>,{" "}
            <span className="text-text-primary">ar on</span> or{" "}
            <span className="text-text-primary">sudo hire-me</span>
          </p>
          <TerminalLine cmd="whoami" />
          <p>[Designer and frontend developer, city.]</p>
          <TerminalLine />
        </div>
      </Drawer>
    </div>
  );
}
