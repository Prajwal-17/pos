import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { useEffect } from "react";

const SearchDropdown = ({ idx }: { idx: number }) => {
  const searchParam = useSearchDropdownStore((state) => state.searchParam);
  const setSearchResult = useSearchDropdownStore((state) => state.setSearchResult);
  const searchRow = useSearchDropdownStore((state) => state.searchRow);
  const isDropdownOpen = useSearchDropdownStore((state) => state.isDropdownOpen);

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

  return (
    <>
      {isDropdownOpen && searchRow === idx + 1 && (
        <div className="absolute top-full right-0 left-32 z-20 mx-1 h-32 overflow-y-auto rounded-md bg-red-500 px-2 py-2 transition-all">
          <div className="text-accent-foreground border-border grid grid-cols-10 items-center border bg-gray-100 text-base font-semibold">
            <div className="col-span-4 border-r border-gray-300 px-2 py-2 text-left">ITEM</div>
            <div className="col-span-2 border-r border-gray-300 px-2 py-2 text-left">QTY</div>
            <div className="col-span-2 border-r border-gray-300 px-2 py-2 text-left">PRICE</div>
            <div className="col-span-2 px-2 py-2 text-left">AMOUNT</div>
          </div>
          <div></div>
        </div>
      )}
    </>
  );
};

export default SearchDropdown;
