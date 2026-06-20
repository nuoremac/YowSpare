"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { ReactElement } from "react";
import { useT } from "@/components/i18n/useT";
import {
  moduleKeys,
  modules,
  type ModuleKey,
} from "@/config/navigation";
import { useNavigationStore } from "@/hooks/use-navigation-store";
import { useSession } from "@/store/session";

type ModuleSection = {
  key: ModuleKey;
  nameKey: string;
  icon: (props: { className?: string }) => ReactElement;
  links: Array<{
    href: string;
    titleKey: string;
    icon: (props: { className?: string }) => ReactElement;
  }>;
};

function linkIsActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/app") return false;
  return pathname.startsWith(`${href}/`);
}

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const { logout } = useSession();
  const { t } = useT();
  const { activeModule, setActiveModule } = useNavigationStore();

  const visibleModules = useMemo<ModuleSection[]>(() => {
    return moduleKeys
      .map((key) => {
        const moduleConfig = modules[key];
        const links = moduleConfig.sidebarLinks.map((link) => ({
            href: link.href,
            titleKey: link.titleKey,
            icon: link.icon,
          }));
        return {
          key,
          nameKey: moduleConfig.nameKey,
          icon: moduleConfig.icon,
          links,
        };
      })
      .filter((module) => module.links.length > 0);
  }, []);

  const routeModule = useMemo<ModuleKey | null>(() => {
    const match = visibleModules.find((module) => module.links.some((link) => linkIsActive(path, link.href)));
    return match?.key || null;
  }, [path, visibleModules]);

  useEffect(() => {
    if (!visibleModules.length) return;
    const currentModuleIsVisible = visibleModules.some((module) => module.key === activeModule);
    if (currentModuleIsVisible) return;
    setActiveModule(routeModule || visibleModules[0].key);
  }, [activeModule, routeModule, setActiveModule, visibleModules]);

  useEffect(() => {
    // Prefetch all visible destinations to make navigation feel instant.
    const hrefs = visibleModules.flatMap((module) => module.links.map((link) => link.href));
    const uniqueHrefs = Array.from(new Set(hrefs));
    uniqueHrefs.forEach((href) => router.prefetch(href));
  }, [router, visibleModules]);

  const currentSection = useMemo(() => {
    const fromState = visibleModules.find((module) => module.key === activeModule);
    if (fromState) return fromState;
    return visibleModules[0] || null;
  }, [activeModule, visibleModules]);

  const sectionLinks = currentSection?.links || [];
  const moduleLabel = currentSection ? t(currentSection.nameKey as any) : "Navigation";

  return (
    <nav className="flex h-full overflow-hidden">
      <div className="flex w-[60px] shrink-0 flex-col items-center border-r border-border bg-card py-3">
        {visibleModules.map((module) => {
          const isActiveModule = module.key === currentSection?.key;
          const label = t(module.nameKey as any);
          const Icon = module.icon;
          return (
            <button
              key={module.key}
              type="button"
              title={label}
              aria-label={label}
              onClick={() => setActiveModule(module.key)}
              className={`mb-1 grid h-11 w-11 place-items-center rounded-xl border border-transparent transition ${
                isActiveModule ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-sidebar py-3">
        <div className="px-4 pb-2 text-sm font-semibold tracking-tight text-foreground">{moduleLabel}</div>

        <div className="space-y-1 px-1.5">
          {sectionLinks.map((link) => {
            const isActive = linkIsActive(path, link.href);
            const Icon = link.icon;
            return (
              <Link
                key={`${link.href}-${link.titleKey}`}
                href={link.href}
                className={`group flex items-center gap-3 rounded-r-full rounded-l-none px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
                }`}
              >
                <span
                  className={`grid h-5 w-5 place-items-center ${isActive ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>{t(link.titleKey as any)}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto border-t border-border px-1.5 pt-3">
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex w-full items-center gap-3 rounded-r-full rounded-l-none px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <span className="grid h-5 w-5 place-items-center text-red-600 dark:text-red-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path
                  d="M10 7V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2"
                  strokeLinecap="round"
                />
                <path d="M15 12H3m0 0 3-3m-3 3 3 3" strokeLinecap="round" />
              </svg>
            </span>
            <span>{t("nav.logout" as any)}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
