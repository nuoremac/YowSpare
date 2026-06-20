"use client";

import { useEffect, useState } from "react";
import { AgenciesService, OrganizationsService } from "@/lib";
import type { Agency, Organization } from "@/lib";
import { useT } from "@/components/i18n/useT";
import { useSession } from "@/store/session";

export default function AgencyPage() {
 const { t } = useT();
 const { tenant } = useSession();
 const [orgs, setOrgs] = useState<Organization[]>([]);
 const [agencies, setAgencies] = useState<Agency[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 (async () => {
 setLoading(true);
 const results = await Promise.allSettled([
 tenant?.id ? OrganizationsService.getOrganizationById(tenant.id) : Promise.resolve(null),
 AgenciesService.getAgencies(),
 ]);
 const orgRes = results[0] as PromiseSettledResult<Organization | null>;
 const agenciesRes = results[1] as PromiseSettledResult<Agency[]>;

 const org = orgRes.status === "fulfilled" ? orgRes.value : null;
 setOrgs(org ? [org] : tenant ? [tenant] : []);
 setAgencies(agenciesRes.status === "fulfilled" ? agenciesRes.value || [] : []);
 setLoading(false);
 })();
 }, [tenant]);

 return (
 <main className="space-y-4">
 <div className="rounded-2xl border border-gray-200 p-5 ">
 <h2 className="text-lg font-semibold">{t("app.agency.title")}</h2>
 <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
 {t("app.agency.subtitle")}
 </p>
 </div>

 {loading ? (
 <div className="text-sm text-gray-600 dark:text-muted-foreground">{t("app.agency.loading")}</div>
 ) : (
 <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
 <section className="rounded-2xl border border-gray-200 p-5 ">
 <h3 className="font-semibold">{t("app.agency.organizations")}</h3>
 <div className="mt-3 space-y-2">
 {orgs.map((o) => (
 <div key={o.id} className="rounded-xl border border-gray-200 px-3 py-2 text-sm ">
 <div className="font-medium">{o.name}</div>
 <div className="text-xs text-gray-600 dark:text-muted-foreground">{o.email || "—"}</div>
 </div>
 ))}
 {!orgs.length && (
 <div className="text-sm text-gray-600 dark:text-muted-foreground">{t("app.agency.empty.organizations")}</div>
 )}
 </div>
 </section>

 <section className="rounded-2xl border border-gray-200 p-5 ">
 <h3 className="font-semibold">{t("app.agency.agencies")}</h3>
 <div className="mt-3 space-y-2">
 {agencies.map((a) => (
 <div key={a.id} className="rounded-xl border border-gray-200 px-3 py-2 text-sm ">
 <div className="font-medium">{a.name}</div>
 <div className="text-xs text-gray-600 dark:text-muted-foreground">
 {a.type || "—"} · {a.city || a.country || "—"}
 </div>
 </div>
 ))}
 {!agencies.length && (
 <div className="text-sm text-gray-600 dark:text-muted-foreground">{t("app.agency.empty.agencies")}</div>
 )}
 </div>
 </section>
 </div>
 )}
 </main>
 );
}
