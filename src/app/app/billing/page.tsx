"use client";

import { useT } from "@/components/i18n/useT";

export default function BillingPage() {
 const { t } = useT();

 return (
 <main className="p-6 space-y-4">
 <div className="rounded-2xl border border-gray-200 p-5 ">
 <h2 className="text-lg font-semibold">{t("app.billing.title")}</h2>
 <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
 {t("app.billing.subtitle")}
 </p>
 </div>
 </main>
 );
}
