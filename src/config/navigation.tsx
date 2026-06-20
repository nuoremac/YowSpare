"use client";

import type { ReactElement } from "react";
import type { Organization, User } from "@/lib-tiers";

export type ModuleKey = "stock" | "procurement" | "planning" | "settings";

export type NavIcon = (props: { className?: string }) => ReactElement;

export type SidebarLink = {
  titleKey: string;
  href: string;
  roles: string[];
  permissions?: string[];
  icon: NavIcon;
};

export type ModuleConfig = {
  nameKey: string;
  icon: NavIcon;
  sidebarLinks: SidebarLink[];
};

const ROLE_ADMIN = "ROLE_ADMIN";
const ROLE_STOCK_MANAGER = "ROLE_STOCK_MANAGER";
const ROLE_WAREHOUSE_CLERK = "ROLE_WAREHOUSE_CLERK";
const ROLE_PROCUREMENT_MANAGER = "ROLE_PROCUREMENT_MANAGER";
const ROLE_MANAGER = "ROLE_MANAGER";
const ROLE_MAINTENANCE_TECHNICIAN = "ROLE_MAINTENANCE_TECHNICIAN";
const ROLE_STAFF = "ROLE_STAFF";
const ROLE_USER = "ROLE_USER";

const BoxIcon: NavIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 7l9-4 9 4v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" strokeLinecap="round" />
    <path d="M9 19v-6h6v6" strokeLinecap="round" />
  </svg>
);

const CartIcon: NavIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 7h12l-1.5 11H7.5L6 7z" strokeLinecap="round" />
    <path d="M9 7V5h6v2" strokeLinecap="round" />
  </svg>
);

const CalendarIcon: NavIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 4v3M18 4v3M4 9h16" strokeLinecap="round" />
    <path d="M5 20h14a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1z" strokeLinecap="round" />
  </svg>
);

const ShieldIcon: NavIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3l7 3v5c0 5-3.2 8.3-7 10-3.8-1.7-7-5-7-10V6l7-3z" strokeLinecap="round" />
    <path d="M9.5 12.5 11 14l3.5-3.5" strokeLinecap="round" />
  </svg>
);

const DashboardIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" strokeLinecap="round" />
  </svg>
);

const InventoryIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M6 7h12l-2 10H8L6 7z" strokeLinecap="round" />
    <path d="M9 7V5h6v2" strokeLinecap="round" />
  </svg>
);

const CatalogIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M5 6a2 2 0 0 1 2-2h10v16H7a2 2 0 0 1-2-2V6z" strokeLinecap="round" />
    <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
  </svg>
);

const SuppliersIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M3 7h11v10H3z" strokeLinecap="round" />
    <path d="M14 10h4l3 3v4h-7v-7z" strokeLinecap="round" />
    <circle cx="7" cy="19" r="1.5" />
    <circle cx="18" cy="19" r="1.5" />
  </svg>
);

const ClipboardIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M8 4h8v3H8z" strokeLinecap="round" />
    <path d="M6 7h12v13H6z" strokeLinecap="round" />
    <path d="M9 11h6M9 15h6" strokeLinecap="round" />
  </svg>
);

const CheckListIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M4 6h16M4 12h10M4 18h10" strokeLinecap="round" />
    <path d="m17 11 2 2 3-3M17 17l2 2 3-3" strokeLinecap="round" />
  </svg>
);

const IssueIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M4 7h16v10H4z" strokeLinecap="round" />
    <path d="M8 12h8M12 8v8" strokeLinecap="round" />
  </svg>
);

const TraceIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M4 5h6v6H4zM14 13h6v6h-6z" strokeLinecap="round" />
    <path d="M10 8h4v8" strokeLinecap="round" />
    <path d="M12 16h2" strokeLinecap="round" />
  </svg>
);

const WrenchIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M15 4a4 4 0 0 0 5 5l-8 8a2 2 0 1 1-3-3l8-8a4 4 0 0 0-2-2z" strokeLinecap="round" />
    <path d="M7 17l-2 2" strokeLinecap="round" />
  </svg>
);

const AlertIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M12 3 2 21h20L12 3z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 9v5M12 18h.01" strokeLinecap="round" />
  </svg>
);

const UserIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4z" strokeLinecap="round" />
    <path d="M6 20v-1a6 6 0 0 1 12 0v1" strokeLinecap="round" />
  </svg>
);

const EnterpriseIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M4 20V4h8v16M12 8h8v12" strokeLinecap="round" />
    <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" strokeLinecap="round" />
  </svg>
);

const UsersIcon: NavIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM16 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" strokeLinecap="round" />
    <path d="M3.5 20v-1.5a4.5 4.5 0 0 1 9 0V20M13.5 20v-1a3.5 3.5 0 0 1 7 0V20" strokeLinecap="round" />
  </svg>
);

const SettingsIcon: NavIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path
      d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1.2 1.2a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-1.7a1 1 0 0 1-1-1v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0l-1.2-1.2a1 1 0 0 1 0-1.4l.1-.1A1 1 0 0 0 4.6 15a1 1 0 0 0-.9-.6H3.5a1 1 0 0 1-1-1v-1.7a1 1 0 0 1 1-1h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1.2-1.2a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1 1 0 0 1 1-1h1.7a1 1 0 0 1 1 1v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1.2 1.2a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a1 1 0 0 1 1 1v1.7a1 1 0 0 1-1 1h-.2a1 1 0 0 0-.9.6Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const moduleKeys = ["stock", "procurement", "planning", "settings"] as const;

export const modules: Record<ModuleKey, ModuleConfig> = {
  stock: {
    nameKey: "app.nav.module.stock",
    icon: BoxIcon,
    sidebarLinks: [
      {
        href: "/app",
        titleKey: "nav.dashboard",
        roles: [ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_WAREHOUSE_CLERK, ROLE_PROCUREMENT_MANAGER, ROLE_MANAGER, ROLE_MAINTENANCE_TECHNICIAN, ROLE_STAFF, ROLE_USER],
        icon: DashboardIcon,
      },
      {
        href: "/app/inventory",
        titleKey: "nav.inventory",
        roles: [ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_PROCUREMENT_MANAGER, ROLE_MANAGER, ROLE_MAINTENANCE_TECHNICIAN, ROLE_WAREHOUSE_CLERK, ROLE_STAFF],
        permissions: ["inventory:read"],
        icon: InventoryIcon,
      },
      {
        href: "/app/catalog-list",
        titleKey: "nav.catalog",
        roles: [ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_PROCUREMENT_MANAGER, ROLE_MANAGER, ROLE_STAFF, ROLE_USER],
        permissions: ["products:read"],
        icon: CatalogIcon,
      },
      {
        href: "/app/catalog",
        titleKey: "nav.myCatalog",
        roles: [ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_PROCUREMENT_MANAGER, ROLE_MANAGER, ROLE_STAFF, ROLE_USER],
        permissions: ["products:read"],
        icon: CatalogIcon,
      },
      {
        href: "/app/warehouse",
        titleKey: "nav.warehouse",
        roles: [ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_WAREHOUSE_CLERK, ROLE_MANAGER, ROLE_MAINTENANCE_TECHNICIAN],
        permissions: ["inventory:read"],
        icon: BoxIcon,
      },
      {
        href: "/app/issues-returns",
        titleKey: "nav.issuesReturns",
        roles: [ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_WAREHOUSE_CLERK, ROLE_MANAGER, ROLE_MAINTENANCE_TECHNICIAN],
        permissions: ["inventory:read"],
        icon: IssueIcon,
      },
      {
        href: "/app/cycle-counts",
        titleKey: "nav.cycleCounts",
        roles: [ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_WAREHOUSE_CLERK],
        permissions: ["inventory:read"],
        icon: CheckListIcon,
      },
      {
        href: "/app/traceability",
        titleKey: "nav.traceability",
        roles: [ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_MANAGER, ROLE_PROCUREMENT_MANAGER],
        permissions: ["inventory:read"],
        icon: TraceIcon,
      },
    ],
  },
  procurement: {
    nameKey: "app.nav.module.procurement",
    icon: CartIcon,
    sidebarLinks: [
      {
        href: "/app/procurement",
        titleKey: "nav.procurement",
        roles: [ROLE_ADMIN, ROLE_PROCUREMENT_MANAGER, ROLE_MANAGER],
        permissions: ["procurement:read"],
        icon: CartIcon,
      },
      {
        href: "/app/quotations",
        titleKey: "nav.quotations",
        roles: [ROLE_ADMIN, ROLE_PROCUREMENT_MANAGER, ROLE_MANAGER],
        permissions: ["procurement:read"],
        icon: ClipboardIcon,
      },
      {
        href: "/app/purchase-orders",
        titleKey: "nav.purchaseOrders",
        roles: [ROLE_ADMIN, ROLE_PROCUREMENT_MANAGER, ROLE_MANAGER],
        permissions: ["procurement:read"],
        icon: ClipboardIcon,
      },
      {
        href: "/app/receipts",
        titleKey: "nav.receipts",
        roles: [ROLE_ADMIN, ROLE_PROCUREMENT_MANAGER, ROLE_WAREHOUSE_CLERK, ROLE_STOCK_MANAGER],
        permissions: ["procurement:read"],
        icon: BoxIcon,
      },
      {
        href: "/app/suppliers",
        titleKey: "nav.suppliers",
        roles: [ROLE_ADMIN, ROLE_PROCUREMENT_MANAGER, ROLE_STOCK_MANAGER],
        permissions: ["third-parties:read"],
        icon: SuppliersIcon,
      },
    ],
  },
  planning: {
    nameKey: "app.nav.module.planning",
    icon: CalendarIcon,
    sidebarLinks: [
      {
        href: "/app/planner",
        titleKey: "nav.planner",
        roles: [ROLE_ADMIN, ROLE_MANAGER, ROLE_MAINTENANCE_TECHNICIAN],
        permissions: ["inventory:read", "procurement:read"],
        icon: CalendarIcon,
      },
      {
        href: "/app/internal-requests",
        titleKey: "nav.internalRequests",
        roles: [ROLE_ADMIN, ROLE_MANAGER, ROLE_MAINTENANCE_TECHNICIAN, ROLE_STAFF, ROLE_USER],
        permissions: ["resources:read"],
        icon: ClipboardIcon,
      },
      {
        href: "/app/approvals",
        titleKey: "nav.approvals",
        roles: [ROLE_ADMIN, ROLE_MANAGER, ROLE_PROCUREMENT_MANAGER],
        permissions: ["resources:write"],
        icon: CheckListIcon,
      },
      {
        href: "/app/work-orders",
        titleKey: "nav.workOrders",
        roles: [ROLE_ADMIN, ROLE_MANAGER, ROLE_MAINTENANCE_TECHNICIAN],
        permissions: ["inventory:read"],
        icon: WrenchIcon,
      },
      {
        href: "/app/exceptions",
        titleKey: "nav.exceptions",
        roles: [ROLE_ADMIN, ROLE_MANAGER, ROLE_PROCUREMENT_MANAGER, ROLE_STOCK_MANAGER],
        permissions: ["inventory:read", "procurement:read"],
        icon: AlertIcon,
      },
    ],
  },
  settings: {
    nameKey: "app.nav.module.settings",
    icon: ShieldIcon,
    sidebarLinks: [
      {
        href: "/app/settings",
        titleKey: "nav.settings",
        roles: [ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_WAREHOUSE_CLERK, ROLE_PROCUREMENT_MANAGER, ROLE_MANAGER, ROLE_MAINTENANCE_TECHNICIAN, ROLE_STAFF, ROLE_USER],
        permissions: ["settings:read"],
        icon: SettingsIcon,
      },
      {
        href: "/app/profile",
        titleKey: "app.user.menu.profile",
        roles: [ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_WAREHOUSE_CLERK, ROLE_PROCUREMENT_MANAGER, ROLE_MANAGER, ROLE_MAINTENANCE_TECHNICIAN, ROLE_STAFF, ROLE_USER],
        icon: UserIcon,
      },
      {
        href: "/app/enterprise",
        titleKey: "app.settings.enterprise",
        roles: [ROLE_ADMIN, ROLE_STOCK_MANAGER, ROLE_WAREHOUSE_CLERK, ROLE_PROCUREMENT_MANAGER, ROLE_MANAGER, ROLE_MAINTENANCE_TECHNICIAN, ROLE_STAFF, ROLE_USER],
        permissions: ["organizations:read"],
        icon: EnterpriseIcon,
      },
      {
        href: "/app/admin",
        titleKey: "app.admin.title",
        roles: [ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF, ROLE_USER],
        permissions: [
          "administration:read",
          "administration:roles:read",
          "administration:roles:write",
        ],
        icon: ShieldIcon,
      },
      {
        href: "/app/users",
        titleKey: "app.settings.users",
        roles: [ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF, ROLE_USER],
        permissions: ["hrm:employee:read"],
        icon: UsersIcon,
      },
    ],
  },
};

export const canAccessSidebarLink = (
  _link: SidebarLink,
  _authorities: string[] | null | undefined,
  _user?: User | null,
  _organization?: Organization | null,
) => true;

export const findSidebarLinkForPath = (pathname: string) =>
  moduleKeys
    .flatMap((key) => modules[key].sidebarLinks)
    .filter((link) =>
      link.href === "/app"
        ? pathname === link.href
        : pathname === link.href || pathname.startsWith(`${link.href}/`),
    )
    .sort((left, right) => right.href.length - left.href.length)[0];

export const canAccessPath = (
  _pathname: string,
  _authorities: string[] | null | undefined,
  _user?: User | null,
  _organization?: Organization | null,
) => true;
