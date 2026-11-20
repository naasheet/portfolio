"use client";

import { useState } from "react";
import { Drawer } from "@/components/overlay/Drawer";
import { Modal } from "@/components/overlay/Modal";
import { Sheet } from "@/components/overlay/Sheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Divider } from "@/components/ui/Divider";
import { toast } from "@/lib/toast";

const LONG = Array.from(
  { length: 14 },
  (_, i) =>
    `Paragraph ${i + 1}. Long enough to scroll inside the panel while the page behind stays put. Wheel, touch and keyboard scrolling all stay in here.`,
);

const FIELD =
  "h-11 w-full rounded-control border border-border-default bg-bg-base px-4 text-subhead text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus";

/** Opens each overlay with sample focusable content, plus toast triggers. */
export function OverlaySpecimen() {
  const [sheet, setSheet] = useState(false);
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [filter, setFilter] = useState(false);

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
        <Button variant="ghost" onClick={() => toast("Copied")}>
          Toast
        </Button>
        <Button
          variant="ghost"
          onClick={() => toast("Message sent", { tone: "success" })}
        >
          Success toast
        </Button>
        <Button
          variant="ghost"
          onClick={() => toast("Camera blocked", { tone: "danger" })}
        >
          Danger toast
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
        Esc or a backdrop click closes the topmost overlay; focus returns to the
        button that opened it. On a phone-width window the sheet becomes a
        bottom sheet: drag its handle down.
      </p>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Sheet"
        closeLabel="Close sheet"
      >
        <div className="flex flex-col gap-4 pb-2">
          <input
            className={FIELD}
            placeholder="Type here"
            aria-label="Sample field"
          />
          <div className="flex flex-wrap gap-2">
            <Chip selected={filter} onClick={() => setFilter((f) => !f)}>
              A chip
            </Chip>
            <Button size="sm" onClick={() => setModal(true)}>
              Open a modal on top
            </Button>
          </div>
          <Divider />
          {LONG.map((p) => (
            <p key={p} className="text-subhead text-text-secondary">
              {p}
            </p>
          ))}
          <a
            href="#overlays"
            className="text-subhead text-accent-primary underline"
          >
            A link at the end
          </a>
        </div>
      </Sheet>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Modal"
        closeLabel="Close modal"
      >
        <div className="flex flex-col gap-4 pb-2">
          <p className="text-subhead text-text-secondary">
            Tab cycles between the close button, the field and the two buttons,
            and never leaves.
          </p>
          <input
            className={FIELD}
            placeholder="Your name"
            aria-label="Your name"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModal(false);
                toast("Saved", { tone: "success" });
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Drawer"
        closeLabel="Close drawer"
      >
        <div className="flex flex-col gap-4 pb-2 text-footnote font-mono">
          <p className="text-accent-primary">nasheet@portfolio:~$</p>
          <input
            className={FIELD}
            placeholder="The terminal input lives here in 6.1"
            aria-label="Command"
          />
        </div>
      </Drawer>
    </div>
  );
}
