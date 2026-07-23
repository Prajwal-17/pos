import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SettingsField } from "../SettingsField";
import { SettingsSection } from "../SettingsSection";
import { PALETTES, useColorPalette, type PaletteId } from "@/features/theme/useColorPalette";

const DESCRIPTION = "Customize the appearance of the app.";

const PALETTE_LABELS: Record<PaletteId, string> = {
  "palette-1": "Palette 1",
  "palette-2": "Palette 2",
  "palette-3": "Palette 3"
};

const PALETTE_SWATCH: Record<PaletteId, string> = {
  "palette-1": "oklch(0.43 0.08 258)",
  "palette-2": "oklch(0.48 0.10 70)",
  "palette-3": "oklch(0.48 0.08 185)"
};

const STEP = 0.05;

function factorToPercent(factor: number): number {
  return Math.round(factor * 100);
}

function percentToFactor(percent: number): number {
  return percent / 100;
}

export const AppearanceSection = () => {
  const [zoom, setZoom] = useState<number | null>(null);
  const [bounds, setBounds] = useState<{ min: number; max: number; default: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sliderPercent, setSliderPercent] = useState<number | null>(null);
  const { palette, setPalette } = useColorPalette();

  useEffect(() => {
    async function init() {
      try {
        const [zoomResult, boundsResult] = await Promise.all([
          window.zoomApi.getZoom(),
          window.zoomApi.getBounds()
        ]);
        setZoom(zoomResult.zoomFactor);
        setSliderPercent(factorToPercent(zoomResult.zoomFactor));
        setBounds(boundsResult);
      } catch (err) {
        console.error("Failed to load zoom settings", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSliderDrag = useCallback((value: number[]) => {
    setSliderPercent(value[0]!);
  }, []);

  const handleSliderCommit = useCallback(async (value: number[]) => {
    const percent = value[0]!;
    const factor = percentToFactor(percent);
    try {
      await window.zoomApi.setZoom(factor);
      setZoom(factor);
    } catch (err) {
      console.error("Failed to set zoom", err);
    }
  }, []);

  const handleReset = useCallback(async () => {
    const defaultZoom = bounds?.default ?? 1;
    const defaultPercent = factorToPercent(defaultZoom);
    setSliderPercent(defaultPercent);
    setZoom(defaultZoom);
    try {
      await window.zoomApi.setZoom(defaultZoom);
    } catch (err) {
      console.error("Failed to reset zoom", err);
    }
  }, [bounds]);

  if (loading || bounds === null || zoom === null || sliderPercent === null) {
    return (
      <SettingsSection title="Appearance" description={DESCRIPTION}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      </SettingsSection>
    );
  }

  const minPercent = factorToPercent(bounds.min);
  const maxPercent = factorToPercent(bounds.max);

  return (
    <SettingsSection title="Appearance" description={DESCRIPTION}>
      <SettingsField
        label="Zoom level"
        hint="Adjust the zoom level of the app."
        defaultValue="100%"
        onReset={handleReset}
      >
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-12 text-right text-sm tabular-nums">
            {minPercent}%
          </span>
          <Slider
            value={[sliderPercent]}
            min={minPercent}
            max={maxPercent}
            step={factorToPercent(STEP)}
            onValueChange={handleSliderDrag}
            onValueCommit={handleSliderCommit}
            className="flex-1"
          />
          <span className="text-muted-foreground w-12 text-sm tabular-nums">{maxPercent}%</span>
        </div>
        <div className="mt-1 text-center">
          <span className="text-foreground text-base font-semibold tabular-nums">
            {sliderPercent}%
          </span>
        </div>
      </SettingsField>
      <SettingsField
        label="Color palette"
        hint="Choose a color palette for the app."
      >
        <div className="flex gap-3">
          {PALETTES.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPalette(id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors",
                palette === id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              <div
                className="size-8 rounded-full border-2 border-border shadow-sm"
                style={{ backgroundColor: PALETTE_SWATCH[id] }}
              />
              <span className="text-sm font-medium">{PALETTE_LABELS[id]}</span>
            </button>
          ))}
        </div>
      </SettingsField>
    </SettingsSection>
  );
};
