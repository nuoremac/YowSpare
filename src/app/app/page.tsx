"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/store/session";

export default function AppHomePage() {
  const router = useRouter();
  const { tenant, user, role } = useSession();

  // 🔐 Guard: must be authenticated
  useEffect(() => {
    if (!tenant || !user) {
      router.replace("/"); // back to auth
    }
  }, [tenant, user, router]);

  if (!tenant || !user) return null;

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <h1 className="text-2xl font-semibold">YowSpare</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tenant: <span className="font-medium">{tenant.name}</span> ·
          User: <span className="font-medium">{user.email}</span> ·
          Role: <span className="font-medium">{role}</span>
        </p>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(role === "TECH" || role === "WAREHOUSE" || role === "PROCUREMENT" || role === "PLANNER") && (
          <NavCard
            href="/inventory"
            title="Inventory"
            desc="Search parts, check quantities, remove stock (offline)."
          />
        )}

        {(role === "WAREHOUSE") && (
          <NavCard
            href="/warehouse"
            title="Warehouse"
            desc="Bin map, stock IN / transfers, QR workflows."
          />
        )}

        {(role === "PROCUREMENT") && (
          <NavCard
            href="/procurement"
            title="Procurement"
            desc="Reorder alerts, supplier comparison, purchase orders."
          />
        )}

        {(role === "PLANNER") && (
          <NavCard
            href="/planner"
            title="Planner"
            desc="Offline analytics, SQL queries, charts."
          />
        )}
      </div>

      {/* Offline note */}
      <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        This application works fully offline. All actions are stored locally and
        synchronized automatically when connectivity is restored.
      </div>
    </main>
  );
}

function NavCard(props: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={props.href}
      className="rounded-2xl border border-gray-200 p-5 hover:border-gray-400 transition"
    >
      <h2 className="text-lg font-semibold">{props.title}</h2>
      <p className="mt-2 text-sm text-gray-600">{props.desc}</p>
    </Link>
  );
}
