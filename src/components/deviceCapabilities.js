import { useState, useEffect } from "react";

// Detecteert of prefers-reduced-motion actief staat, live (luistert naar wijzigingen).
// Geen three.js/fiber-imports hier, zodat dit los van Hero3D (lazy-loaded) gebruikt kan
// worden om te beslissen OF Hero3D uberhaupt geladen moet worden.
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Ruwe hardware-heuristiek zodat oudere/goedkopere telefoons de CSS-banner
// krijgen i.p.v. de zwaardere 3D-canvas.
export function isLowPowerDevice() {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  return cores <= 2 || mem <= 2;
}
