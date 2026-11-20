import { ArrowRight, ArrowUpRight, ChevronDown, Download } from "lucide-react";
import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { DevState } from "./DevState";
import { forced } from "./devStates";

const ROWS: {
  variant: ButtonVariant;
  label: string;
  hover: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  text: string;
}[] = [
  {
    variant: "primary",
    label: "Primary",
    hover: forced.primaryHover,
    trailing: <ChevronDown />,
    text: "See the work",
  },
  {
    variant: "secondary",
    label: "Secondary",
    hover: forced.secondaryHover,
    trailing: <ArrowUpRight />,
    text: "Work with me",
  },
  {
    variant: "ghost",
    label: "Ghost",
    hover: forced.ghostHover,
    leading: <Download />,
    text: "Resume",
  },
];

/** Button: variants × states, then sizes, icons and the link form. */
export function ButtonSpecimen() {
  return (
    <div className="flex flex-col gap-8">
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max flex-col gap-4 p-1">
          {ROWS.map(({ variant, label, hover, leading, trailing, text }) => {
            const p = { variant, leadingIcon: leading, trailingIcon: trailing };
            return (
              <div key={variant} className="flex items-start gap-6">
                <span className="w-24 pt-4 text-subhead text-text-secondary">
                  {label}
                </span>
                <DevState label="Default (live)">
                  <Button {...p}>{text}</Button>
                </DevState>
                <DevState label="Hover">
                  <Button {...p} tabIndex={-1} className={hover}>
                    {text}
                  </Button>
                </DevState>
                <DevState label="Pressed · 0.97">
                  <Button
                    {...p}
                    tabIndex={-1}
                    className={cn(hover, forced.pressed)}
                  >
                    {text}
                  </Button>
                </DevState>
                <DevState label="Focus-visible">
                  <Button {...p} tabIndex={-1} className={forced.focus}>
                    {text}
                  </Button>
                </DevState>
                <DevState label="Disabled">
                  <Button {...p} disabled>
                    {text}
                  </Button>
                </DevState>
                <DevState label="Loading">
                  <Button {...p} loading>
                    {text}
                  </Button>
                </DevState>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <DevState label="sm · 36 · 13/18">
          <Button size="sm">Copy email</Button>
        </DevState>
        <DevState label="md · 44 · 15/20 (default)">
          <Button size="md">Copy email</Button>
        </DevState>
        <DevState label="lg · 52 · 17/22">
          <Button size="lg">Copy email</Button>
        </DevState>
        <DevState label="Leading icon">
          <Button variant="secondary" leadingIcon={<Download />}>
            Resume
          </Button>
        </DevState>
        <DevState label="Trailing icon">
          <Button variant="secondary" trailingIcon={<ArrowUpRight />}>
            Work with me
          </Button>
        </DevState>
        <DevState label="Link (href) · same look">
          <Button variant="ghost" href="#buttons" trailingIcon={<ArrowRight />}>
            Read case study
          </Button>
        </DevState>
        <DevState label="sm / lg loading">
          <div className="flex items-center gap-4">
            <Button size="sm" loading>
              Copy email
            </Button>
            <Button size="lg" variant="secondary" loading>
              Copy email
            </Button>
          </div>
        </DevState>
      </div>
    </div>
  );
}
