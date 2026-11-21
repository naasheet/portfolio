/*
 * Ask for one frame outside the ticker. FrameDriver registers a requester only under reduced
 * motion (when nothing renders continuously); otherwise the next tick draws anyway.
 */
let requester: (() => void) | null = null;

export function setFrameRequester(fn: (() => void) | null): void {
  requester = fn;
}

export function requestFrame(): void {
  requester?.();
}
