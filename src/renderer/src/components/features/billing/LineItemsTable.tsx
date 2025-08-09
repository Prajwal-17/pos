import { useEffect, useRef, useState } from "react";
import { GripVertical, IndianRupee, Minus, Plus, Trash2 } from "lucide-react";
import { useBillingStore } from "@/store/billingStore";
import SearchDropdown from "./SearchDropdown";
import { Button } from "@/components/ui/button";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import QuantityPresets from "./QuantityPresets";

export type ItemType = {
  id: string;
  name: string;
  quantity: number;
  mrp: number;
  price: number;
  amount: number;
};

const LineItemsTable = () => {
  const popDownRef = useRef<HTMLDivElement | null>(null);
  const lineItems = useBillingStore((state) => state.lineItems);
  const addEmptyLineItem = useBillingStore((state) => state.addEmptyLineItem);
  const updateLineItems = useBillingStore((state) => state.updateLineItems);
  const deleteLineItem = useBillingStore((state) => state.deleteLineItem);

  const setSearchParam = useSearchDropdownStore((state) => state.setSearchParam);
  const setSearchRow = useSearchDropdownStore((state) => state.setSearchRow);
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await window.productsApi.getAllProducts();
        console.log(response);
        // setLineItems(response);
      } catch (error) {
        console.log(error);
      }
    }
    fetchProducts();
  }, []);

  const totalAmount = lineItems.reduce((sum, currentItem) => {
    return sum + Number(currentItem.amount || 0);
  }, 0);

  const [qtyPresetOpen, setQtyPresetOpen] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQtyPresetOpen(null);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (popDownRef.current && !popDownRef.current.contains(e.target as Node))
        setQtyPresetOpen(null);
    };

    if (qtyPresetOpen != null) {
      console.log("here");
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleMouseDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [qtyPresetOpen, setQtyPresetOpen]);

  return (
    <>
      <div className="h-full w-full flex-1 overflow-auto">
        <div className="w-full space-y-0 py-5">
          <div className="text-accent-foreground border-border grid grid-cols-20 items-center border bg-gray-100 text-base font-semibold">
            <div className="col-span-2 border-r border-gray-300 py-2 text-center">#</div>
            <div className="col-span-9 border-r border-gray-300 px-2 py-2 text-left">ITEM</div>
            <div className="col-span-3 border-r border-gray-300 px-2 py-2 text-left">QTY</div>
            <div className="col-span-3 border-r border-gray-300 px-2 py-2 text-left">PRICE</div>
            <div className="col-span-3 px-2 py-2 text-left">AMOUNT</div>
          </div>

          <div className="relative w-full space-y-1 py-3">
            {lineItems.map((item, idx: number) => (
              <div key={idx} className="relative">
                <div className="group grid w-full grid-cols-20 border bg-neutral-100">
                  <div className="col-span-2 h-full w-full border-r bg-white">
                    <div className="flex h-full w-full items-center justify-between gap-2 px-4">
                      <GripVertical
                        className="invisible px-1 py-1 group-hover:visible hover:cursor-grab hover:bg-neutral-100"
                        size={33}
                      />
                      <span className="text-xl">{idx + 1}</span>
                      <Trash2
                        className="text-destructive invisible rounded-md px-1 py-1 group-hover:visible hover:scale-103 hover:cursor-pointer hover:bg-neutral-100 active:scale-98"
                        size={33}
                        onClick={() => deleteLineItem(item.id)}
                      />
                    </div>
                  </div>
                  <div className="col-span-9 border-r px-1 py-1">
                    <input
                      value={item.name}
                      className="focus:border-ring focus:ring-ring w-full rounded-lg border bg-white px-2 py-2 text-lg font-bold shadow-sm transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
                      onClick={() => {
                        setSearchRow(idx + 1);
                        setIsDropdownOpen();
                      }}
                      onChange={(e) => {
                        setSearchParam(e.target.value);
                        updateLineItems(item.id, "name", e.target.value);
                      }}
                    />
                  </div>
                  <div ref={popDownRef} className="col-span-3 h-full w-full border-r px-1 py-1">
                    <div className="border-border relative flex h-full w-full items-center rounded-lg border bg-white font-bold shadow-sm">
                      <button
                        onClick={() => {
                          if (item.quantity >= 0) {
                            const newQuantity = item.quantity + 1;
                            updateLineItems(item.id, "quantity", newQuantity);
                          }
                        }}
                        className="hover:bg-primary/80 bg-primary flex h-full w-20 cursor-pointer items-center justify-center rounded-lg rounded-r-none text-white transition-all active:scale-95"
                      >
                        <Plus size={22} />
                      </button>
                      <input
                        type="number"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setQtyPresetOpen(idx);
                        }}
                        value={item.quantity === 0 ? null : item.quantity}
                        className="focus:border-ring focus:ring-ring w-full appearance-none rounded-lg px-2 py-2 text-center text-base font-semibold placeholder-gray-400 transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
                        onChange={(e) => {
                          updateLineItems(item.id, "quantity", e.target.value);
                        }}
                        placeholder="0"
                      />
                      <button
                        disabled={item.quantity <= 0}
                        className="hover:bg-primary/80 bg-primary flex h-full w-20 cursor-pointer items-center justify-center rounded-lg rounded-l-none text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={() => {
                          if (item.quantity > 1) {
                            const newQuantity = item.quantity - 1;
                            updateLineItems(item.id, "quantity", newQuantity);
                          }
                        }}
                      >
                        <Minus size={22} />
                      </button>
                      <QuantityPresets
                        itemId={item.id}
                        qtyPresetOpen={qtyPresetOpen}
                        idx={idx}
                        setQtyPresetOpen={setQtyPresetOpen}
                      />
                    </div>
                  </div>
                  <div className="col-span-3 border-r px-1 py-1">
                    <div className="relative h-full w-full">
                      <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                        <IndianRupee size={18} />
                      </span>
                      <input
                        type="number"
                        value={item.price === 0 ? null : item.price}
                        onChange={(e) => updateLineItems(item.id, "price", e.target.value)}
                        className="focus:border-ring focus:ring-ring h-full w-full appearance-none rounded-lg border bg-white py-2 pr-7 pl-10 text-right text-base font-semibold text-black placeholder-gray-400 focus:ring-2 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="col-span-3 border-r px-1 py-1">
                    <div className="relative h-full w-full">
                      <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                        <IndianRupee size={18} />
                      </span>
                      <input
                        disabled
                        type="number"
                        value={item.amount === 0 ? "" : item.amount}
                        className="focus:border-ring focus:ring-ring h-full w-full appearance-none rounded-lg border bg-white py-2 pr-7 pl-10 text-right text-base font-semibold text-black placeholder-gray-400 focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <SearchDropdown idx={idx} />
              </div>
            ))}

            <div className="grid w-full grid-cols-10 border bg-neutral-100">
              <div className="col-span-1"></div>
              <div className="col-span-2">
                <Button className="hover:cursor-pointer" onClick={addEmptyLineItem}>
                  Add Row
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t-border flex h-16 w-full items-center justify-between border bg-white px-6 py-4">
        <div className="text-xl font-bold">Total Amount:</div>
        <div className="text-primary text-3xl font-extrabold">₹ {totalAmount}</div>
      </div>
    </>
  );
};

export default LineItemsTable;
