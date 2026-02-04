"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "./Nav";
import { useSession } from "@/store/session";
import { usePathname, useRouter } from "next/navigation";
import { PageSearchProvider } from "@/components/PageSearchContext";
import ThemeToggle from "@/components/ThemeToggle";
import { setAuthToken, setTenantId } from "@/lib/api";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, tenant, token } = useSession();
  const [ready, setReady] = useState(false);
  const [isAsideOpen, setIsAsideOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  useEffect(() => {
    setAuthToken(token || null);
  }, [token]);

  useEffect(() => {
    setTenantId(tenant?.id || null);
  }, [tenant]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 768px)");
    const syncAside = () => setIsAsideOpen(media.matches);
    syncAside();
    media.addEventListener("change", syncAside);
    return () => media.removeEventListener("change", syncAside);
  }, []);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !user) router.replace("/");
  }, [ready, user, router]);

  if (!ready || !user) return null;

  const PageSearchBoundary = ({
    children,
  }: {
    children: (value: { pageSearch: string; setPageSearch: (next: string) => void }) => React.ReactNode;
  }) => {
    const [pageSearch, setPageSearch] = useState("");
    return (
      <PageSearchProvider value={{ query: pageSearch, setQuery: setPageSearch }}>
        {children({ pageSearch, setPageSearch })}
      </PageSearchProvider>
    );
  };

  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "YS";

  return (
    <PageSearchBoundary key={pathname}>
      {({ pageSearch, setPageSearch }) => (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="flex min-h-screen flex-col md:flex-row">
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-slate-200 bg-white px-5 py-6 transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 ${
              isAsideOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center gap-2 pb-5">
            <Link
              href="/"
              className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              aria-label="Go to landing page"
            >
              <img src="/icons/yowspareicon.png" alt="YowSpare icon" className="h-7 w-7" />
            </Link>
            <Link href="/" className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400">
              YowSpare
            </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Workspace
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {tenant?.name || "YowSpare"}
                  </div>
                </div>
                <button className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M4 20V4h8v16M12 8h8v12" strokeLinecap="round" />
                    <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="mt-6">
              <Nav />
            </div>
          </aside>

          <div
            className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ${
              isAsideOpen ? "md:pl-64" : "md:pl-0"
            }`}
          >
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex items-center gap-3 px-6 py-4">
                <button
                  type="button"
                  aria-label={isAsideOpen ? "Close navigation" : "Open navigation"}
                  onClick={() => setIsAsideOpen((prev) => !prev)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M5 7h14M5 12h14M5 17h9" strokeLinecap="round" />
                  </svg>
                </button>
                {!isAsideOpen && (
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                      <img src="/icons/yowspareicon.png" alt="YowSpare icon" className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-semibold text-slate-500 md:ml-0 dark:text-slate-400">YowSpare</div>
                  </div>
                )}
                <div className="relative ml-2 flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
                      <circle cx="11" cy="11" r="7" />
                    </svg>
                  </span>
                  <input
                    type="search"
                    placeholder="Rechercher..."
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    className="w-full max-w-xl rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-300"
                  />
                </div>
                <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Settings"
                    aria-expanded={isSettingsMenuOpen}
                    onClick={() => setIsSettingsMenuOpen((prev) => !prev)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  >
                    ⚙️
                  </button>
                  {isSettingsMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      onMouseLeave={() => setIsSettingsMenuOpen(false)}
                    >
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M4 20V4h8v16M12 8h8v12" strokeLinecap="round" />
                          <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" strokeLinecap="round" />
                        </svg>
                        Entreprise
                      </button>
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM16 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" strokeLinecap="round" />
                          <path d="M3.5 20v-1.5a4.5 4.5 0 0 1 9 0V20M13.5 20v-1a3.5 3.5 0 0 1 7 0V20" strokeLinecap="round" />
                        </svg>
                        Utilisateurs
                      </button>
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M6 17h12l-1-2v-5a5 5 0 0 0-10 0v5z" strokeLinecap="round" />
                          <path d="M10 17a2 2 0 0 0 4 0" strokeLinecap="round" />
                        </svg>
                        Notifications
                      </button>
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7l7-4z" strokeLinecap="round" />
                          <path d="m9.5 12.5 1.8 1.8 3.2-3.2" strokeLinecap="round" />
                        </svg>
                        Securite
                      </button>
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M6 4h9l3 3v13H6z" strokeLinecap="round" />
                          <path d="M9 4v6h6" strokeLinecap="round" />
                          <path d="M9 16h6" strokeLinecap="round" />
                        </svg>
                        Sauvegarde
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Open user menu"
                    aria-expanded={isUserMenuOpen}
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white"
                  >
                    {initials}
                  </button>
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      onMouseLeave={() => setIsUserMenuOpen(false)}
                    >
                      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Administrateur</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                      </div>
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4z" strokeLinecap="round" />
                          <path d="M6 20v-1a6 6 0 0 1 12 0v1" strokeLinecap="round" />
                        </svg>
                        Profil
                      </button>
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M7 4h10v16l-2-1-3 1-3-1-2 1z" strokeLinecap="round" />
                          <path d="M9 8h6M9 12h6" strokeLinecap="round" />
                        </svg>
                        Facturation
                      </button>
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z" strokeLinecap="round" />
                          <path d="M4 12h2m12 0h2M12 4v2m0 12v2M6.3 6.3l1.4 1.4m8.6 8.6 1.4 1.4M6.3 17.7l1.4-1.4m8.6-8.6 1.4-1.4" strokeLinecap="round" />
                        </svg>
                        Parametres
                      </button>
                      <div className="border-t border-slate-200 dark:border-slate-800">
                        <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M10 7V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2" strokeLinecap="round" />
                            <path d="M15 12H3m0 0 3-3m-3 3 3 3" strokeLinecap="round" />
                          </svg>
                          Se deconnecter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>
            </header>

            <main className="px-6 py-6">{children}</main>
          </div>
        </div>
        </div>
      )}
    </PageSearchBoundary>
  );
}
