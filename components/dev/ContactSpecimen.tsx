"use client";

import { ArrowRight, Download } from "lucide-react";
import { useState } from "react";
import { CTACard } from "@/components/cards/CTACard";
import { EmailCard } from "@/components/cards/EmailCard";
import { SocialCard } from "@/components/cards/SocialCard";
import { TimeCard } from "@/components/cards/TimeCard";
import { ContactSheet } from "@/components/contact/ContactSheet";
import { InstagramIcon } from "@/components/media/icons/InstagramIcon";
import { BentoGrid } from "@/components/ui/BentoGrid";
import { BentoItem } from "@/components/ui/BentoItem";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { DevState } from "./DevState";
import { forcedCardHover } from "./devStates";

/**
 * 4.7: TextField states, the Contact cards and the sheet. The sheet here posts to the real
 * /api/contact, so sending stores a message (and emails it): use the Contact page for that.
 */
export function ContactSpecimen() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 md:grid-cols-2">
        <DevState label="TextField · default">
          <TextField label="Name" placeholder="[Placeholder]" />
        </DevState>
        <DevState label="TextField · focus-visible">
          <TextField
            label="Name"
            defaultValue="[Riya]"
            className="[&_input]:outline-2 [&_input]:outline-offset-2 [&_input]:outline-border-focus"
          />
        </DevState>
        <DevState label="TextField · error">
          <TextField
            label="Email"
            defaultValue="riya@studio"
            error="That email looks unfinished. Missing the .com?"
          />
        </DevState>
        <DevState label="TextField · disabled">
          <TextField label="Name" defaultValue="[Disabled]" disabled />
        </DevState>
        <DevState label="TextField · multiline with hint row">
          <TextField
            multiline
            label="Message"
            defaultValue="[Message]"
            hint="9 / 2000"
            hintEnd="Esc to close"
          />
        </DevState>
        <DevState label="ContactSheet (posts to the real API)">
          <Button onClick={() => setOpen(true)} trailingIcon={<ArrowRight />}>
            Open the sheet
          </Button>
        </DevState>
      </div>
      <BentoGrid>
        <BentoItem col={{ md: 6, lg: 7 }} row={{ lg: 2 }}>
          <CTACard
            variant="hero"
            hoverable
            className="h-full"
            eyebrow="Messages"
            status="[Status line]"
            title="Say hello"
            body="[One line of copy.]"
            actions={<Button trailingIcon={<ArrowRight />}>[Action]</Button>}
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 5 }}>
          <EmailCard
            hoverable
            className="h-full"
            eyebrow="Email"
            email="[you@domain.com]"
            labels={{
              copy: "Copy",
              copied: "Copied",
              openMail: "Open mail app",
              copiedAlert: "Email copied",
              copyFailed: "Couldn't copy it.",
            }}
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 5 }}>
          <TimeCard
            hoverable
            className="h-full"
            eyebrow="Local time · [City]"
            note="[A short note.]"
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 4 }}>
          <SocialCard
            {...forcedCardHover}
            platform="Hover · Follow"
            handle="@[handle]"
            href="https://example.com"
            icon={<InstagramIcon />}
            newTabLabel="opens in a new tab"
            hoverLabel="Follow"
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 4 }}>
          <SocialCard
            download
            platform="Resume"
            handle="[Updated …]"
            meta="PDF · [180] KB"
            href="/resume.pdf"
            icon={<Download />}
            newTabLabel=""
          />
        </BentoItem>
        <BentoItem col={{ md: 6, lg: 4 }}>
          <SocialCard
            download
            layout="row"
            platform="Resume (row)"
            handle="PDF · [180] KB"
            href="/resume.pdf"
            icon={<Download />}
            newTabLabel=""
          />
        </BentoItem>
      </BentoGrid>
      <ContactSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
