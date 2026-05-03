"use client";

import { useEffect } from "react";

// All four bands are kept light so foreground text/UI chrome stays
// readable without per-band overrides. Night is a cool slate-blue,
// not pitch-dark — feels nocturnal but doesn't break the picker page.
const BG = {
  dawn: "#fdf6e8",
  day: "#fafaf9",
  dusk: "#f3edf2",
  night: "#e8ebf1",
} as const;

const FG = {
  dawn: "#1c1917",
  day: "#1c1917",
  dusk: "#1c1917",
  night: "#1c1917",
} as const;

type Band = keyof typeof BG;

function bandFor(hour: number): Band {
  if (hour >= 5 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

// Pure client-side: server has no idea what timezone the visitor is in.
export function TimeOfDayBackground() {
  useEffect(() => {
    const apply = () => {
      const b = bandFor(new Date().getHours());
      document.body.style.setProperty("--background", BG[b]);
      document.body.style.setProperty("--foreground", FG[b]);
      document.body.dataset.skyBand = b;
    };
    apply();
    const id = setInterval(apply, 60_000);
    return () => clearInterval(id);
  }, []);
  return null;
}
