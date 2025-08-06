import { useEffect } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { useBillingStore } from "@/store/billingStore";
import SearchDropdown from "./SearchDropdown";
import { Button } from "@/components/ui/button";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";

export type ItemType = {
  id: string;
  name: string;
  quantity: number;
  mrp: number;
  price: number;
  amount: number;
};

const LineItemsTable = () => {
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

  return (
    <>
      <div className="h-full w-full flex-1 overflow-auto">
        <div className="w-full space-y-0 py-5">
          <div className="text-accent-foreground border-border grid grid-cols-10 items-center border bg-gray-100 text-base font-semibold">
            <div className="col-span-1 border-r border-gray-300 py-2 text-center">#</div>
            <div className="col-span-3 border-r border-gray-300 px-2 py-2 text-left">ITEM</div>
            <div className="col-span-2 border-r border-gray-300 px-2 py-2 text-left">QTY</div>
            <div className="col-span-2 border-r border-gray-300 px-2 py-2 text-left">PRICE</div>
            <div className="col-span-2 px-2 py-2 text-left">AMOUNT</div>
          </div>

          <div className="relative w-full space-y-1 py-3">
            {lineItems.map((item, idx: number) => (
              <div key={idx} className="relative">
                <div className="group grid w-full grid-cols-10 border bg-neutral-100">
                  <div className="col-span-1 h-full w-full border-r bg-white">
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
                  <div className="col-span-3 border-r px-1 py-1">
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
                  <div className="col-span-2 border-r px-1 py-1">
                    <input
                      value={item.quantity}
                      className="focus:border-ring focus:ring-ring w-full rounded-lg border bg-white px-2 py-2 text-center text-base font-semibold shadow-sm transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
                      onChange={(e) => {
                        updateLineItems(item.id, "quantity", e.target.value);
                      }}
                    />
                  </div>
                  <div className="col-span-2 border-r px-1 py-1">
                    <input
                      value={item.price}
                      className="focus:border-ring focus:ring-ring w-full rounded-lg border bg-white px-2 py-2 text-center text-base font-semibold shadow-sm transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
                      onChange={(e) => {
                        updateLineItems(item.id, "price", e.target.value);
                      }}
                    />
                  </div>
                  <div className="col-span-2 border-r px-1 py-1">
                    <input
                      value={item.amount}
                      className="focus:border-ring focus:ring-ring w-full rounded-lg border bg-white px-2 py-2 text-center text-base font-semibold shadow-sm transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
                      onChange={(e) => {
                        updateLineItems(item.id, "amount", e.target.value);
                      }}
                    />
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
    </>
  );
};

export default LineItemsTable;
