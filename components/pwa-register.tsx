"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // De app blijft werken als registratie in een lokale/private context niet is toegestaan.
      });
    }
  }, []);
  return null;
}
