import { create } from "zustand";
import { devtools } from "zustand/middleware";

type ReferenceWindowStore = {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  toggle: () => void;
};

export const useReferenceWindowStore = create<ReferenceWindowStore>()(
  devtools(
    (set) => ({
      isOpen: false,
      setOpen: (isOpen) => set({ isOpen }, false, "referenceWindow/setOpen"),
      toggle: () => set((state) => ({ isOpen: !state.isOpen }), false, "referenceWindow/toggle")
    }),
    { name: "billing-reference-window-store" }
  )
);
