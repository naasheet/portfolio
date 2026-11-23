import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getIsland } from "@/lib/island";
import { setHandMode } from "@/lib/shortcuts";
import { useStore } from "@/lib/store";
import { classify, stopCamera } from "../camera";

const ar = () => useStore.getState().ar;
const stubWindow = (touch: boolean) =>
  vi.stubGlobal("window", {
    matchMedia: (q: string) => ({ matches: touch && q.includes("coarse") }),
  });

beforeEach(() => {
  useStore.setState((s) => ({
    ar: { ...s.ar, enabled: false, explainerOpen: false, camera: "yes" },
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe("classify", () => {
  it("refusals are denied, everything else an error", () => {
    expect(classify(new DOMException("x", "NotAllowedError"))).toBe("denied");
    expect(classify(new DOMException("x", "SecurityError"))).toBe("denied");
    expect(classify(new DOMException("x", "NotReadableError"))).toBe("error");
    expect(classify(new DOMException("x", "NotFoundError"))).toBe("error");
    expect(classify(new Error("?"))).toBe("error");
  });
});

describe("stopCamera", () => {
  it("stops every track", () => {
    const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }];
    stopCamera({ getTracks: () => tracks } as unknown as MediaStream);
    for (const t of tracks) expect(t.stop).toHaveBeenCalledOnce();
  });
});

describe("setHandMode (8.1)", () => {
  it("opens the explainer instead of turning Hand on", () => {
    stubWindow(false);
    setHandMode(true);
    expect(ar().explainerOpen).toBe(true);
    expect(ar().enabled).toBe(false);
  });
  it("on a phone, explains instead", () => {
    stubWindow(true);
    setHandMode(true);
    expect(ar().explainerOpen).toBe(false);
    expect(getIsland().alert?.text).toBe("Best on a laptop");
  });
  it("with no camera, says so", () => {
    stubWindow(false);
    useStore.getState().ar.setCamera("none");
    setHandMode(true);
    expect(ar().explainerOpen).toBe(false);
    expect(getIsland().alert?.text).toBe("No camera here");
  });
  it("Mouse turns Hand off and closes the explainer", () => {
    stubWindow(false);
    useStore.getState().ar.setExplainerOpen(true);
    useStore.getState().ar.setEnabled(true);
    setHandMode(false);
    expect(ar().enabled).toBe(false);
    expect(ar().explainerOpen).toBe(false);
  });
});
