"use client";

import { useEffect, useState } from "react";
import { AgenciesService, OrganizationsService } from "@/lib";
import type { Agency, Organization } from "@/lib";

export default function AgencyPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [o, a] = await Promise.all([
        OrganizationsService.getMyOrganizations(),
        AgenciesService.getAgencies(),
      ]);
      setOrgs(o || []);
      setAgencies(a || []);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Agency</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          Organizations and agencies from the API.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-600 dark:text-slate-400">Loading agencies…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold">Organizations</h3>
            <div className="mt-3 space-y-2">
              {orgs.map((o) => (
                <div key={o.id} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-800">
                  <div className="font-medium">{o.name}</div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">{o.email || "—"}</div>
                </div>
              ))}
              {!orgs.length && <div className="text-sm text-gray-600 dark:text-slate-400">No organizations.</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold">Agencies</h3>
            <div className="mt-3 space-y-2">
              {agencies.map((a) => (
                <div key={a.id} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-800">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">
                    {a.type || "—"} · {a.city || a.country || "—"}
                  </div>
                </div>
              ))}
              {!agencies.length && <div className="text-sm text-gray-600 dark:text-slate-400">No agencies.</div>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
