import { useBillingStore } from "@/store/billingStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { useEffect, useRef } from "react";

const SearchDropdown = ({ idx }: { idx: number }) => {
  const searchParam = useSearchDropdownStore((state) => state.searchParam);
  const searchResult = useSearchDropdownStore((state) => state.searchResult);
  const setSearchResult = useSearchDropdownStore((state) => state.setSearchResult);
  const searchRow = useSearchDropdownStore((state) => state.searchRow);
  const isDropdownOpen = useSearchDropdownStore((state) => state.isDropdownOpen);
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);
  const addLineItem = useBillingStore((state) => state.addLineItem);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setSearchResult([]);
        const response = await window.productsApi.search(searchParam);
        console.log("search result ", response);
        setSearchResult(response);
      } catch (error) {
        console.log("error", error);
      }
    }
    fetchProducts();
  }, [searchParam]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    if (isDropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <>
      {isDropdownOpen && searchRow === idx + 1 && (
        <div
          ref={dropdownRef}
          className="border-primary absolute top-full right-0 left-32 z-20 mx-1 h-96 overflow-y-auto rounded-md border-2 bg-neutral-200 transition-all"
        >
          <div
            className="text-accent-foreground border-border sticky top-0 grid w-full grid-cols-8 items-center border bg-white px-2 py-2 text-base font-semibold"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="col-span-4 border-r border-gray-300 px-2 py-2 text-left">ITEM</div>
            <div className="col-span-2 border-r border-gray-300 px-2 py-2 text-left">PRICE</div>
            <div className="col-span-2 border-r border-gray-300 px-2 py-2 text-left">MRP</div>
          </div>
          <div className="space-y-2 px-2 py-2 text-lg">
            {searchResult.map((item, index) => (
              <div
                key={index}
                className="grid w-full grid-cols-8 rounded-lg px-2 py-1 hover:cursor-pointer hover:bg-blue-200"
                onClick={() => {
                  addLineItem(idx, item);
                  setIsDropdownOpen();
                }}
              >
                <div className="col-span-4 border-r border-black px-1 py-1">{item.name}</div>
                <div className="col-span-2 border-r border-black px-1 py-1">{item.mrp}</div>
                <div className="col-span-2 px-1 py-1">{item.price}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default SearchDropdown;
