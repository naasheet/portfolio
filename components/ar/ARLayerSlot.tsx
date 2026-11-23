"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useStore } from "@/lib/store";

const ARExplainer = dynamic(() => import("./ARExplainer"), { ssr: false });
const ARLayer = dynamic(() => import("./ARLayer"), { ssr: false });

/**
 * Mount point for Hand mode (8.1) in the persistent layer. Nothing loads until it's needed: the
 * explainer the first time it opens (ar.explainerOpen), the camera layer (ARLayer: the camera, its
 * preview, later the tracking and the hand cursor) the first time Hand turns on. Both stay mounted
 * afterwards, so they can animate out and keep their state.
 */
export function ARLayerSlot() {
  const explainer = useStore((s) => s.ar.explainerOpen);
  const enabled = useStore((s) => s.ar.enabled);
  const [loaded, setLoaded] = useState({ explainer: false, layer: false });
  if ((explainer && !loaded.explainer) || (enabled && !loaded.layer))
    setLoaded({
      explainer: loaded.explainer || explainer,
      layer: loaded.layer || enabled,
    });
  return (
    <>
      {loaded.explainer ? <ARExplainer /> : null}
      {loaded.layer ? <ARLayer /> : null}
    </>
  );
}
