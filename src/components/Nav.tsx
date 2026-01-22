"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/store/session";
import type { Role } from "@/lib/type";

type NavLink = {
  href: string;
  label: string;
  roles: Role[];
  icon: React.ReactNode;
};

const itemBase =
  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition";
const active = "bg-[var(--brand-soft)] text-[var(--brand)]";
const inactive = "text-slate-600 hover:bg-slate-50";

const links: NavLink[] = [
  {
    href: "/app/inventory",
    label: "Produits",
    roles: ["PROCUREMENT", "WAREHOUSE", "TECH", "PLANNER", "SUPPLIER"],
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 7h12l-2 10H8L6 7z" strokeLinecap="round" />
        <path d="M9 7V5h6v2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/app/warehouse",
    label: "Mouvements",
    roles: ["WAREHOUSE", "PROCUREMENT"],
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 8h10M14 8l-3-3m3 3-3 3" strokeLinecap="round" />
        <path d="M20 16H10m0 0 3-3m-3 3 3 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/app/procurement",
    label: "Liste fournisseurs",
    roles: ["PROCUREMENT", "SUPPLIER"],
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M7 7h10M7 12h10M7 17h7" strokeLinecap="round" />
        <rect x="4" y="4" width="16" height="16" rx="3" />
      </svg>
    ),
  },
  {
    href: "/app/planner",
    label: "Commandes",
    roles: ["PLANNER", "PROCUREMENT"],
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M7 5h10v14H7z" strokeLinecap="round" />
        <path d="M9 9h6M9 13h6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Nav() {
  const path = usePathname();
  const { role } = useSession();

  if (!role) return null; // ✅ wait for persisted rehydrate

  const visibleLinks = links.filter((l) => l.roles.includes(role));

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
              path === l.href ? "bg-white text-[var(--brand)]" : "bg-white text-slate-700"
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
