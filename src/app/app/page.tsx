"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/store/session";
import {
  AgenciesService,
  EmployeesRolesService,
  OrganizationsService,
  SystemAuditsService,
} from "@/lib";
import { ProductCatalogService, StockLevelsService, StockMovementsService } from "@/lib1";
import type { Agency, Organization, OrganizationMember, SystemAudit } from "@/lib";
import type { Product, StockLevel, StockMovement } from "@/lib1";

export default function AppHomePage() {
  const { tenant, user } = useSession();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [employees, setEmployees] = useState<OrganizationMember[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [audits, setAudits] = useState<SystemAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [o, a, e, p, s, m, au] = await Promise.all([
        OrganizationsService.getMyOrganizations(),
        AgenciesService.getAgencies(),
        EmployeesRolesService.getEmployees(),
        ProductCatalogService.getProducts(),
        StockLevelsService.getStockLevels(),
        StockMovementsService.getAllMovements(),
        SystemAuditsService.getOrganizationActivity(6),
      ]);
      setOrgs(o || []);
      setAgencies(a || []);
      setEmployees(e || []);
      setProducts(p || []);
      setLevels(s || []);
      setMovements(m || []);
      setAudits(au || []);
      setLoading(false);
    })();
  }, [user]);

  const lowStockCount = useMemo(() => {
    const byProduct = new Map<string, number>();
    levels.forEach((l) => {
      const current = byProduct.get(l.productId || "") || 0;
      byProduct.set(l.productId || "", current + (l.quantity || 0));
    });
    return products.filter((p) => {
      const qty = byProduct.get(p.id || "") || 0;
      return typeof p.minStockLevel === "number" ? qty <= p.minStockLevel : false;
    }).length;
  }, [levels, products]);

  const recentMovements = useMemo(() => movements.slice(0, 5), [movements]);

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-amber-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
              Dashboard
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Welcome back {user?.firstName || user?.email}
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {tenant?.name || orgs?.[0]?.name || "Organization"}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            Live API snapshot
          </div>
        </div>
      </section>

      {loading ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard…</div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs text-slate-500">Organizations</div>
              <div className="mt-2 text-2xl font-semibold">{orgs.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs text-slate-500">Agencies</div>
              <div className="mt-2 text-2xl font-semibold">{agencies.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs text-slate-500">Employees</div>
              <div className="mt-2 text-2xl font-semibold">{employees.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs text-slate-500">Low stock</div>
              <div className="mt-2 text-2xl font-semibold">{lowStockCount}</div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Recent stock movements</h3>
                <Link href="/app/warehouse" className="text-xs text-blue-600 dark:text-blue-300">
                  View
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {recentMovements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                    <div>
                      <div className="font-medium">{m.reference || m.id}</div>
                      <div className="text-xs text-slate-500">{m.type} · {m.status}</div>
                    </div>
                    <div className="text-xs text-slate-500">{m.date || m.validatedAt || "—"}</div>
                  </div>
                ))}
                {!recentMovements.length && (
                  <div className="text-sm text-slate-500">No movements yet.</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">System audits</h3>
                <Link href="/app/admin" className="text-xs text-blue-600 dark:text-blue-300">
                  View
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {audits.map((a) => (
                  <div key={a.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                    <div className="font-medium">{a.action || "—"}</div>
                    <div className="text-xs text-slate-500">{a.date || "—"}</div>
                  </div>
                ))}
                {!audits.length && <div className="text-sm text-slate-500">No audits yet.</div>}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
