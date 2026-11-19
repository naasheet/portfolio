"use client";

import { useEffect } from "react";
import { hydratePersisted } from "@/lib/store";

/**
 * Loads the saved sound choice and theme into the store after hydration, so the server and
 * the first client render agree. Mounted once in app/layout.tsx; renders nothing.
 */
export function StoreHydrator() {
  useEffect(() => {
    hydratePersisted();
  }, []);

  return null;
}
