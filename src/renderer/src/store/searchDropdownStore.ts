import { create } from "zustand";

type SearchResultType = {
  id: string;
  name: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: number;
};

type SearchDropdownStoreType = {
  searchParam: string;
  setSearchParam: (query: string) => void;
  searchResult: SearchResultType[];
  setSearchResult: (newResult: SearchResultType[]) => void;
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
