import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Organization, User } from "@/lib";
import { setAgencyId, setAuthToken, setOrganizationId, setTenantId } from "@/lib/api";

type SessionState = {
  tenant: Organization | null;
  user: User | null;
  roles: string[];
  activeAgencyId: string | null;
  token: string | null;
  currency: string;
  setTenant: (t: Organization | null) => void;
  setUser: (u: User | null) => void;
  setRoles: (roles: string[]) => void;
  setActiveAgencyId: (id: string | null) => void;
  setToken: (token: string | null) => void;
  setCurrency: (currency: string) => void;
  logout: () => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      tenant: null,
      user: null,
      roles: [],
      activeAgencyId: null,
      token: null,
      currency: "XAF",
      setTenant: (tenant) => set({ tenant }),
      setUser: (user) => set({ user }),
      setRoles: (roles) => set({ roles }),
      setActiveAgencyId: (activeAgencyId) => set({ activeAgencyId }),
      setToken: (token) => {
        setAuthToken(token);
        set({ token });
      },
      setCurrency: (currency) => set({ currency }),
      logout: () => {
        setAuthToken(null);
        setTenantId(null);
        setOrganizationId(null);
        setAgencyId(null);
        set({ tenant: null, user: null, roles: [], activeAgencyId: null, token: null, currency: "XAF" });
      },
    }),
    {
      name: "yowspare-session",
      partialize: (s) => ({
        tenant: s.tenant,
        user: s.user,
        roles: s.roles,
        activeAgencyId: s.activeAgencyId,
        token: s.token,
        currency: s.currency,
      }),
    }
  )
);
