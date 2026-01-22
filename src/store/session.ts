import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, Tenant, User } from "@/lib/type";

type SessionState = {
  tenant: Tenant | null;
  user: User | null;
  role: Role | null;
  setTenant: (t: Tenant | null) => void;
  setUser: (u: User | null) => void;
  setRole: (r: Role | null) => void;
  logout: () => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      tenant: null,
      user: null,
      role: null,
      setTenant: (tenant) => set({ tenant }),
      setUser: (user) => set({ user, role: user?.role ?? null }),
      setRole: (role) => set({ role }),
      logout: () => set({ tenant: null, user: null, role: null }),
    }),
    {
      name: "yowspare-session",
      partialize: (s) => ({ tenant: s.tenant, user: s.user, role: s.role }),
    }
  )
);
