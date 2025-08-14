import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useBillingStore } from "@/store/billingStore";

const QuantityPresets = ({
  itemId,
  idx,
  qtyPresetOpen,
  setQtyPresetOpen
}: {
  itemId: string;
  idx: number;
  qtyPresetOpen: number | null;
  setQtyPresetOpen: React.Dispatch<React.SetStateAction<number | null>>;
}) => {
  const updateLineItems = useBillingStore((state) => state.updateLineItems);
  const numbers = Array.from({ length: 40 }, (_, i) => i + 1);

  // https://preline.co/docs/custom-scrollbar.html#rounded-corners
  const scrollStyles = `[&::-webkit-scrollbar]:w-2
    [&::-webkit-scrollbar-track]:rounded-full
    [&::-webkit-scrollbar-track]:bg-gray-200
    [&::-webkit-scrollbar-thumb]:rounded-full
    [&::-webkit-scrollbar-thumb]:bg-gray-400
    dark:[&::-webkit-scrollbar-track]:bg-neutral-700
    dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500`;

  function handlePresetClick(e: React.MouseEvent) {
    const button = (e.target as HTMLElement).closest("button");
    if (!button?.dataset.value) {
      return;
    }
    updateLineItems(itemId, "quantity", parseFloat(button.dataset.value));
    setQtyPresetOpen(null);
  }

  const weights = [
    {
      label: "50g",
      weight: "0.050"
    },
    {
      label: "100g",
      weight: "0.100"
    },
    {
      label: "250g",
      weight: "0.250"
    },
    {
      label: "500g",
      weight: "0.500"
    },
    {
      label: "750g",
      weight: "0.750"
    }
  ];

  if (qtyPresetOpen != idx) {
    return null;
  }

  return (
    <>
      <div className="bg-muted absolute top-full left-1/2 z-50 mt-2 w-max -translate-x-1/2 rounded-xl px-1 py-2 shadow-2xl">
        <div className="grid w-max grid-flow-row grid-cols-4 gap-1 px-1">
          {weights.map((w, idx) => (
            <Button
              key={idx}
              variant="outline"
              data-value={w.weight}
              type="button"
              size="sm"
              className="col-span-1"
              onClick={(e) => {
                handlePresetClick(e);
              }}
            >
              {w.label}
            </Button>
          ))}
        </div>

        <Separator className="my-3 w-full bg-gray-300" />

        <div
          className={`grid max-h-48 w-full grid-flow-row grid-cols-5 gap-1 overflow-y-auto scroll-smooth px-2 py-1 ${scrollStyles}`}
        >
          {numbers.map((i) => (
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-full hover:cursor-pointer"
              key={i}
              data-value={i}
              onClick={(e) => {
                handlePresetClick(e);
              }}
            >
              {i}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default QuantityPresets;
