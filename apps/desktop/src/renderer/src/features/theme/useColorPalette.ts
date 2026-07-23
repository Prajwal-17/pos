import { useCallback, useEffect, useState } from "react";

export const PALETTES = ["palette-1", "palette-2", "palette-3"] as const;
export type PaletteId = (typeof PALETTES)[number];

const STORAGE_KEY = "quickcart-color-palette";

function getStoredPalette(): PaletteId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && PALETTES.includes(stored as PaletteId)) {
      return stored as PaletteId;
    }
  } catch {
    // localStorage unavailable
  }
  return "palette-1";
}

export function useColorPalette() {
  const [palette, setPaletteState] = useState<PaletteId>(getStoredPalette);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  const setPalette = useCallback((next: PaletteId) => {
    setPaletteState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return { palette, setPalette } as const;
}
