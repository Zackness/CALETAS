import { create } from "zustand";

type ConfettiStore = {
    isOpen: boolean;
    onOpen: () => void;
    onCLose: () => void;
};

export const useConfettiStore = create<ConfettiStore>((set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onCLose: () => set({ isOpen: false }),
}));