"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/store/session";

type NavLink = {
  href: string;
  label: string;
  roles: string[];
  icon: React.ReactNode;
};

const itemBase =
  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition";
const active = "bg-[var(--brand-soft)] text-[var(--brand)] dark:bg-slate-800";
const inactive = "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800";
const allRoles: string[] = [
  "ORG_ADMIN",
  "TENANT_ADMIN",
  "INVENTORY_MANAGER",
  "ANALYST",
  "PROCUREMENT_MANAGER",
  "PROCUREMENT",
  "WAREHOUSE",
  "TECH",
  "PLANNER",
  "SUPPLIER",
];

const links: NavLink[] = [
  {
    href: "/app",
    label: "Dashboard",
    roles: allRoles,
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/app/inventory",
    label: "Inventory",
    roles: allRoles,
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 7h12l-2 10H8L6 7z" strokeLinecap="round" />
        <path d="M9 7V5h6v2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/app/orders",
    label: "Orders",
    roles: allRoles,
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M7 5h10v14H7z" strokeLinecap="round" />
        <path d="M9 9h6M9 13h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/app/admin",
    label: "Users & Roles",
    roles: allRoles,
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM16 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" strokeLinecap="round" />
        <path d="M3.5 20v-1.5a4.5 4.5 0 0 1 9 0V20M13.5 20v-1a3.5 3.5 0 0 1 7 0V20" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/app/agency",
    label: "Agency",
    roles: allRoles,
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 20V4h8v16M12 8h8v12" strokeLinecap="round" />
        <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/app/suppliers",
    label: "Suppliers",
    roles: allRoles,
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 7h11v10H3z" strokeLinecap="round" />
        <path d="M14 10h4l3 3v4h-7v-7z" strokeLinecap="round" />
        <circle cx="7" cy="19" r="1.5" />
        <circle cx="18" cy="19" r="1.5" />
      </svg>
    ),
  },
  {
    href: "/app/reports",
    label: "Reports",
    roles: allRoles,
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 20V4h16" strokeLinecap="round" />
        <path d="M7 16l4-4 3 2 4-6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Nav() {
  const path = usePathname();
  const { roles } = useSession();

  const visibleLinks = roles.length
    ? links.filter((l) => l.roles.some((r) => roles.includes(r)))
    : links;

  return (
    <nav className="space-y-1">
      {visibleLinks.map((l) => (
        <Link
          key={`${l.href}-${l.label}`}
          href={l.href}
          className={`${itemBase} ${path === l.href ? active : inactive}`}
        >
          <span
            className={`grid h-8 w-8 place-items-center rounded-lg shadow-sm ${
              path === l.href
                ? "bg-white text-[var(--brand)] dark:bg-slate-900"
                : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            {l.icon}
          </span>
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
