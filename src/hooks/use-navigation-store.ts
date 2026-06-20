import { create } from "zustand";
import { moduleKeys, type ModuleKey } from "@/config/navigation";

type NavigationState = {
  activeModule: ModuleKey;
  setActiveModule: (module: ModuleKey) => void;
};

const defaultModule = moduleKeys[0] as ModuleKey;

export const useNavigationStore = create<NavigationState>((set) => ({
  activeModule: defaultModule,
  setActiveModule: (module) => set({ activeModule: module }),
}));
