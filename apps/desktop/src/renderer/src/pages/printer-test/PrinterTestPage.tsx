import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";

// ── Types ──────────────────────────────────────────────────────────────

interface PresetResult {
  name: string;
  description: string;
  byteCount: number;
  hexPreview: string;
  textPreview: string;
  paperSize: string;
  columns: number;
  options: Record<string, unknown>;
}

interface GenerateResult {
  label: string;
  byteCount: number;
  hexPreview: string;
  textPreview: string;
  paperSize: string;
  columns: number;
}

type ViewMode = "text" | "hex";

// ── Main Component ─────────────────────────────────────────────────────

export default function PrinterTestPage() {
  const [presets, setPresets] = useState<PresetResult[]>([]);
  const [customResult, setCustomResult] = useState<GenerateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("text");
  const [error, setError] = useState<string | null>(null);

  // Custom form state
  const [paperSize, setPaperSize] = useState<"80mm" | "58mm">("80mm");
  const [headerSize, setHeaderSize] = useState(2);
  const [itemCount, setItemCount] = useState(5);
  const [includeQR, setIncludeQR] = useState(false);
  const [includeBarcode, setIncludeBarcode] = useState(false);
  const [includeStoreDetails, setIncludeStoreDetails] = useState(true);
  const [includePaymentStatus, setIncludePaymentStatus] = useState(true);
  const [boldItems, setBoldItems] = useState(false);
  const [separatorStyle, setSeparatorStyle] = useState<"dash" | "equal" | "dot" | "star">("dash");
  const [feedBeforeCut, setFeedBeforeCut] = useState(3);
  const [footerText, setFooterText] = useState("Thank you for your purchase!");

  // ── Load presets ─────────────────────────────────────────────────────

  const loadPresets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ status: string; data: PresetResult[] }>(
        "/api/printer-test/presets"
      );
      setPresets(res.data);
      if (res.data.length > 0) setSelectedPreset(0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  // ── Generate custom ──────────────────────────────────────────────────

  const generateCustom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{ status: string; data: GenerateResult }>(
        "/api/printer-test/generate",
        {
          paperSize,
          headerSize,
          itemCount,
          includeQR,
          includeBarcode,
          includeStoreDetails,
          includePaymentStatus,
          boldItems,
          separatorStyle,
          feedBeforeCut,
          footerText
        }
      );
      setCustomResult(res.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [
    paperSize,
    headerSize,
    itemCount,
    includeQR,
    includeBarcode,
    includeStoreDetails,
    includePaymentStatus,
    boldItems,
    separatorStyle,
    feedBeforeCut,
    footerText
  ]);

  // ── Active receipt data ──────────────────────────────────────────────

  const activeReceipt =
    activeTab === "presets" && selectedPreset !== null
      ? presets[selectedPreset]
      : activeTab === "custom"
        ? customResult
        : null;

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thermal Printer Test</h1>
          <p className="text-muted-foreground text-sm">
            Generate receipt previews in different formats and sizes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("text")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "text"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Text Preview
          </button>
          <button
            onClick={() => setViewMode("hex")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "hex"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Hex Dump
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg border border-red-200 p-3 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-border flex gap-1 border-b pb-1">
        <button
          onClick={() => setActiveTab("presets")}
          className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "presets"
              ? "bg-background text-foreground border-border border border-b-transparent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Presets ({presets.length})
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "custom"
              ? "bg-background text-foreground border-border border border-b-transparent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Custom Builder
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Left panel — controls */}
        <div className="bg-card border-border flex w-80 shrink-0 flex-col gap-3 overflow-auto rounded-lg border p-4">
          {activeTab === "presets" ? (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60">
                Format Presets
              </h2>
              {presets.map((preset, i) => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(i)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    selectedPreset === i
                      ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                      : "border-border hover:border-primary/40 hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{preset.name}</span>
                    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs font-mono">
                      {preset.byteCount}B
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">{preset.description}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="bg-muted rounded px-1.5 py-0.5 text-xs">
                      {preset.paperSize}
                    </span>
                    <span className="bg-muted rounded px-1.5 py-0.5 text-xs">
                      {preset.columns} cols
                    </span>
                  </div>
                </button>
              ))}
              {loading && (
                <div className="text-muted-foreground py-4 text-center text-sm">Loading...</div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60">
                Custom Options
              </h2>

              {/* Paper Size */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Paper Size</span>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as "80mm" | "58mm")}
                  className="bg-background border-border rounded-md border px-2 py-1.5 text-sm"
                >
                  <option value="80mm">80mm (48 cols)</option>
                  <option value="58mm">58mm (32 cols)</option>
                </select>
              </label>

              {/* Header Size */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Header Size ({headerSize}x)</span>
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={headerSize}
                  onChange={(e) => setHeaderSize(Number(e.target.value))}
                  className="accent-primary"
                />
              </label>

              {/* Item Count */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Items ({itemCount})</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={itemCount}
                  onChange={(e) => setItemCount(Number(e.target.value))}
                  className="accent-primary"
                />
              </label>

              {/* Separator Style */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Separator</span>
                <select
                  value={separatorStyle}
                  onChange={(e) =>
                    setSeparatorStyle(e.target.value as "dash" | "equal" | "dot" | "star")
                  }
                  className="bg-background border-border rounded-md border px-2 py-1.5 text-sm"
                >
                  <option value="dash">Dash (---)</option>
                  <option value="equal">Equal (===)</option>
                  <option value="dot">Dot (...)</option>
                  <option value="star">Star (***)</option>
                </select>
              </label>

              {/* Feed before cut */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Feed before cut ({feedBeforeCut})</span>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={feedBeforeCut}
                  onChange={(e) => setFeedBeforeCut(Number(e.target.value))}
                  className="accent-primary"
                />
              </label>

              {/* Footer text */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Footer Text</span>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="bg-background border-border rounded-md border px-2 py-1.5 text-sm"
                />
              </label>

              {/* Toggles */}
              <div className="flex flex-col gap-2 pt-1">
                <ToggleRow
                  label="Store Details"
                  checked={includeStoreDetails}
                  onChange={setIncludeStoreDetails}
                />
                <ToggleRow
                  label="Payment Status"
                  checked={includePaymentStatus}
                  onChange={setIncludePaymentStatus}
                />
                <ToggleRow label="QR Code" checked={includeQR} onChange={setIncludeQR} />
                <ToggleRow
                  label="Barcode"
                  checked={includeBarcode}
                  onChange={setIncludeBarcode}
                />
                <ToggleRow label="Bold Items" checked={boldItems} onChange={setBoldItems} />
              </div>

              <button
                onClick={generateCustom}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Receipt"}
              </button>
            </>
          )}
        </div>

        {/* Right panel — preview */}
        <div className="bg-card border-border flex flex-1 flex-col overflow-hidden rounded-lg border">
          {activeReceipt ? (
            <>
              {/* Preview header */}
              <div className="border-border flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold">
                    {"name" in activeReceipt ? activeReceipt.name : activeReceipt.label}
                  </h3>
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-mono">
                    {activeReceipt.byteCount} bytes
                  </span>
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                    {activeReceipt.paperSize} · {activeReceipt.columns} cols
                  </span>
                </div>
              </div>

              {/* Receipt content */}
              <div className="flex-1 overflow-auto p-4">
                <div
                  className={`mx-auto rounded-lg border bg-white p-6 font-mono shadow-sm dark:bg-zinc-950 ${
                    activeReceipt.paperSize === "58mm" ? "max-w-sm" : "max-w-lg"
                  }`}
                >
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {viewMode === "text" ? activeReceipt.textPreview : activeReceipt.hexPreview}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              {activeTab === "custom"
                ? "Configure options and click Generate"
                : "Select a preset to preview"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Toggle Row Component ───────────────────────────────────────────────

function ToggleRow({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-xs font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
