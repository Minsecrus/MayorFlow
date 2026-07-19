import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlannerState {
  targets: Record<string, number>;
  slotCount: number;
  setTarget: (itemId: string, quantity: number) => void;
  addTarget: (itemId: string) => void;
  removeTarget: (itemId: string) => void;
  clearTargets: () => void;
  setSlotCount: (slotCount: number) => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      targets: {
        chairs: 2,
        cherrycheesecake: 1,
      },
      slotCount: 5,
      setTarget: (itemId, quantity) =>
        set((state) => {
          const nextTargets = { ...state.targets };
          const nextQuantity = Math.max(0, Math.min(99, Math.floor(quantity)));
          if (nextQuantity === 0) {
            delete nextTargets[itemId];
          } else {
            nextTargets[itemId] = nextQuantity;
          }
          return { targets: nextTargets };
        }),
      addTarget: (itemId) =>
        set((state) => ({
          targets: {
            ...state.targets,
            [itemId]: Math.min(99, (state.targets[itemId] ?? 0) + 1),
          },
        })),
      removeTarget: (itemId) =>
        set((state) => {
          const nextTargets = { ...state.targets };
          delete nextTargets[itemId];
          return { targets: nextTargets };
        }),
      clearTargets: () => set({ targets: {} }),
      setSlotCount: (slotCount) =>
        set({
          slotCount: Math.max(
            1,
            Number.isFinite(slotCount) ? Math.floor(slotCount) : 1,
          ),
        }),
    }),
    {
      name: "mayorflow-planner-v1",
      skipHydration: true,
      partialize: (state) => ({
        targets: state.targets,
        slotCount: state.slotCount,
      }),
    },
  ),
);
