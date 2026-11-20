import { StatusChip } from "@/components/ui/StatusChip";
import { DevState } from "./DevState";

/** StatusChip: the four tones. */
export function StatusChipSpecimen() {
  return (
    <div className="flex flex-wrap items-start gap-8">
      <DevState label="Live · pulsing">
        <StatusChip tone="live">Open to work</StatusChip>
      </DevState>
      <DevState label="Busy">
        <StatusChip tone="busy">Heads down until Friday</StatusChip>
      </DevState>
      <DevState label="Error">
        <StatusChip tone="error">Camera blocked</StatusChip>
      </DevState>
      <DevState label="Idle · no pulse">
        <StatusChip tone="idle">Offline</StatusChip>
      </DevState>
    </div>
  );
}
