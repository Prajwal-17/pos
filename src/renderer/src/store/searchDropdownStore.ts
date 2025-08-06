import { create } from "zustand";

type LineItems = {
  id: string;
  name: string;
  quantity: number;
  mrp: number;
  price: number;
  amount: number;
};
type SearchDropdownStoreType = {
  searchParam: string;
  setSearchParam: (query: string) => void;
  searchResult: LineItems[];
  setSearchResult: (newResult: LineItems[]) => void;
  searchRow: number | null;
  setSearchRow: (rowIndex: number) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: () => void;
};

export const useSearchDropdownStore = create<SearchDropdownStoreType>((set) => ({
  searchParam: "",
  setSearchParam: (query) =>
    set(() => ({
      searchParam: query
    })),

  searchResult: [],
  setSearchResult: (newResult) =>
    set(() => ({
      searchResult: newResult
    })),

  searchRow: null,
  setSearchRow: (rowIndex) =>
    set(() => ({
      searchRow: rowIndex
    })),

  isDropdownOpen: false,
  setIsDropdownOpen: () =>
    set((state) => ({
      isDropdownOpen: !state.isDropdownOpen
    }))
}));
