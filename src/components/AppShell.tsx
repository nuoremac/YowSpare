"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import Nav from "./Nav";
import { useSession } from "@/store/session";
import { useRouter } from "next/navigation";
import { PageSearchProvider } from "@/components/PageSearchContext";
import { setAgencyId, setAuthToken, setOrganizationId, setTenantId } from "@/lib/api";
import { useT } from "@/components/i18n/useT";
import { THEME_CHANGE_EVENT, initTheme, readThemeFromDom, setTheme } from "@/lib/theme";
import { BusinessActorsService, OrganizationsService, UsersService } from "@/lib";
import {
 extractOrganizationLogoFileId,
 getOrganizationLogoBlobUrl,
 normalizeOrganizationLogoUri,
 ORGANIZATION_LOGO_UPDATED_EVENT,
 readOrganizationLogoCache,
 type OrganizationLogoUpdatedDetail,
} from "@/lib/organizationLogo";
import { splitPersonName } from "@/lib/personName";

export default function AppShell({ children }: { children: React.ReactNode }) {
 const router = useRouter();
 const { user, tenant, token, activeAgencyId, setTenant, setUser, setRoles } = useSession();
 const { t } = useT();
 const [ready, setReady] = useState(false);
 const [isAsideOpen, setIsAsideOpen] = useState(true);
 const [enterpriseLogoSrc, setEnterpriseLogoSrc] = useState("");
 const [isDark, setIsDark] = useState(false);
 const [pageSearch, setPageSearch] = useState("");

 // Ensure API clients have auth + tenant headers before any child effects fetch data.
 useLayoutEffect(() => {
 setAuthToken(token || null);
 setTenantId(user?.tenantId || null);
 setOrganizationId(tenant?.id || user?.organizationId || null);
 setAgencyId(activeAgencyId || null);
 }, [activeAgencyId, token, tenant?.id, user?.organizationId, user?.tenantId]);

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

 useEffect(() => {
 if (!token || !user) return;
 let cancelled = false;
 void UsersService.getMe()
 .then((freshUser) => {
 if (cancelled) return;
 if (Array.isArray(freshUser.roles)) {
 setRoles(freshUser.roles);
 }
 setUser({
 ...user,
 ...freshUser,
 roles: freshUser.roles ?? user.roles,
 firstName: freshUser.firstName || user.firstName,
 lastName: freshUser.lastName || user.lastName,
 });
 })
 .catch(() => {
 // The existing session remains usable if the profile refresh is unavailable.
 });
 return () => {
 cancelled = true;
 };
 }, [setRoles, setUser, token, user?.id]);

 useEffect(() => {
 if (!user || user.firstName) return;

 let cancelled = false;
 void BusinessActorsService.getMyProfile()
 .then((actor) => {
 const personName = splitPersonName(actor?.name);
 if (!cancelled && personName.firstName) {
 setUser({ ...user, ...personName });
 }
 })
 .catch(() => {
 // Some employee accounts do not have a personal Business Actor profile.
 });

 return () => {
 cancelled = true;
 };
 }, [setUser, user]);

 useEffect(() => {
 const organizationId = tenant?.id || user?.organizationId || "";
 if (!organizationId || !token) return;

 let cancelled = false;
 void OrganizationsService.getOrganizationById(organizationId)
 .then((organization) => {
 if (!cancelled) setTenant(organization);
 })
 .catch(() => {
 // Keep the persisted organization when details are temporarily unavailable.
 });

 return () => {
 cancelled = true;
 };
 }, [setTenant, tenant?.id, token, user?.organizationId]);

 useEffect(() => {
 let cancelled = false;

 const load = async () => {
 const organizationId = tenant?.id || user?.organizationId || "";
 const tenantId = user?.tenantId || "";
 const cachedLogo = readOrganizationLogoCache(organizationId);

 const normalized = normalizeOrganizationLogoUri(tenant?.logoUri || cachedLogo.uri);
 const logoIdFromUri = extractOrganizationLogoFileId(normalized);
 const logoId = tenant?.logoId || logoIdFromUri || cachedLogo.fileId;

 if (normalized && !logoIdFromUri) {
 if (!cancelled) setEnterpriseLogoSrc(normalized);
 return;
 }

 if (!logoId || !token) {
 if (!cancelled) setEnterpriseLogoSrc("");
 return;
 }

 try {
 const nextObjectUrl = await getOrganizationLogoBlobUrl({
 fileId: logoId,
 organizationId,
 token,
 tenantId,
 });
 if (!cancelled) setEnterpriseLogoSrc(nextObjectUrl);
 } catch {
 if (!cancelled) setEnterpriseLogoSrc("");
 }
 };

 void load();

 return () => {
 cancelled = true;
 };
 }, [tenant?.id, tenant?.logoId, tenant?.logoUri, token, user?.organizationId, user?.tenantId]);

 useEffect(() => {
 const organizationId = tenant?.id || user?.organizationId || "";
 const syncLogo = (event: Event) => {
 const detail = (event as CustomEvent<OrganizationLogoUpdatedDetail>).detail;
 if (detail?.organizationId === organizationId && detail.src) {
 setEnterpriseLogoSrc(detail.src);
 }
 };

 window.addEventListener(ORGANIZATION_LOGO_UPDATED_EVENT, syncLogo);
 return () => window.removeEventListener(ORGANIZATION_LOGO_UPDATED_EVENT, syncLogo);
 }, [tenant?.id, user?.organizationId]);

 useEffect(() => {
 const sync = () => setIsDark(readThemeFromDom() === "dark");
 setIsDark(initTheme() === "dark");
 window.addEventListener(THEME_CHANGE_EVENT, sync);
 return () => window.removeEventListener(THEME_CHANGE_EVENT, sync);
 }, []);

 if (!ready || !user) return null;

 const initials =
 [user.firstName, user.lastName]
 .filter(Boolean)
 .join(" ")
 .split(" ")
 .map((part) => part[0])
 .slice(0, 2)
 .join("")
 .toUpperCase() || "YS";

 const toggleTheme = () => {
 const nextIsDark = !isDark;
 setTheme(nextIsDark ? "dark" : "light");
 setIsDark(nextIsDark);
 };

 return (
 <PageSearchProvider value={{ query: pageSearch, setQuery: setPageSearch }}>
 <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
 <div className="flex h-full bg-background">
 <aside
 className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ${
 isAsideOpen ? "translate-x-0" : "-translate-x-full"
 }`}
 >
 <div className="border-b border-border px-4 pb-3 pt-4">
 <div className="flex items-center gap-3">
 <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-card text-muted-foreground">
 {enterpriseLogoSrc ? (
 <img
 src={enterpriseLogoSrc}
 alt={`${tenant?.name || "Enterprise"} logo`}
 className="h-full w-full object-cover"
 />
 ) : (
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 20V4h8v16M12 8h8v12" strokeLinecap="round" />
 <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" strokeLinecap="round" />
 </svg>
 )}
 </div>
 <div className="min-w-0">
 <Link
 href="/app/enterprise"
 className="block truncate text-base font-semibold tracking-tight text-foreground transition hover:text-primary"
 >
 {tenant?.name || "YowSpare"}
 </Link>
 <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
 {t("app.workspace.label")}
 </div>
 </div>
 </div>
 </div>
 <div className="min-h-0 flex-1">
 <Nav />
 </div>
 </aside>

 <div
 className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ${
 isAsideOpen ? "md:pl-72" : "md:pl-0"
 }`}
 >
 <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
 <div className="flex h-16 items-center gap-3 px-4 md:px-6">
 <button
 type="button"
 aria-label={isAsideOpen ? t("app.nav.close") : t("app.nav.open")}
 onClick={() => setIsAsideOpen((prev) => !prev)}
 className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted"
 >
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M5 7h14M5 12h14M5 17h9" strokeLinecap="round" />
 </svg>
 </button>
 <div className="mr-6 text-lg font-semibold tracking-tight text-foreground">YowSpare</div>
 <div className="relative flex-1 max-w-2xl">
 <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="m21 21-4.3-4.3" strokeLinecap="round" />
 <circle cx="11" cy="11" r="7" />
 </svg>
 </span>
 <input
 type="search"
 placeholder={t("app.search.placeholder")}
 value={pageSearch}
 onChange={(e) => setPageSearch(e.target.value)}
 className="h-12 w-full rounded-full border border-transparent bg-input py-2.5 pl-10 pr-4 text-base text-foreground outline-none transition focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-ring"
 />
 </div>
 <div className="ml-auto flex items-center gap-1">
 <Link
 href="/app/settings"
 className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted"
 aria-label={t("nav.settings" as any)}
 >
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path
 d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1.2 1.2a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-1.7a1 1 0 0 1-1-1v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0l-1.2-1.2a1 1 0 0 1 0-1.4l.1-.1A1 1 0 0 0 4.6 15a1 1 0 0 0-.9-.6H3.5a1 1 0 0 1-1-1v-1.7a1 1 0 0 1 1-1h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1.2-1.2a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1 1 0 0 1 1-1h1.7a1 1 0 0 1 1 1v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1.2 1.2a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a1 1 0 0 1 1 1v1.7a1 1 0 0 1-1 1h-.2a1 1 0 0 0-.9.6Z"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 </svg>
 </Link>
 <button
 type="button"
 onClick={toggleTheme}
 className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-muted"
 aria-label={isDark ? t("app.theme.light" as any) : t("app.theme.dark" as any)}
 >
 {isDark ? (
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
 <circle cx="12" cy="12" r="4.5" />
 <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.7 4.7l1.8 1.8M17.5 17.5l1.8 1.8M19.3 4.7l-1.8 1.8M6.5 17.5l-1.8 1.8" strokeLinecap="round" />
 </svg>
 ) : (
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 )}
 </button>
 <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-medium text-foreground">
 {initials}
 </div>
 </div>
 </div>
 </header>

 <main className="flex-1 overflow-y-auto p-4 pt-2 md:px-6">
 {children}
 </main>
 </div>
 </div>
 </div>
 </PageSearchProvider>
 );
}
