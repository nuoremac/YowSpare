"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/useT";

export default function PricingPage() {
  const { t } = useT();

  return (
    <div className="mx-auto w-full max-w-6xl pt-12">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {t("pricing.label")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl dark:text-slate-100">
            {t("pricing.title")}
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300">
            {t("pricing.body")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
              {t("pricing.chip.billing")}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
              {t("pricing.chip.onboarding")}
            </span>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("pricing.custom.title")}</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {t("pricing.custom.body")}
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-strong)]"
          >
            {t("pricing.custom.cta")}
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          {
            title: t("pricing.tier.starter"),
            price: t("pricing.tier.starter.price"),
            desc: t("pricing.tier.starter.desc"),
            list: [
              t("pricing.tier.starter.item1"),
              t("pricing.tier.starter.item2"),
              t("pricing.tier.starter.item3"),
            ],
          },
          {
            title: t("pricing.tier.operations"),
            price: t("pricing.tier.operations.price"),
            desc: t("pricing.tier.operations.desc"),
            list: [
              t("pricing.tier.operations.item1"),
              t("pricing.tier.operations.item2"),
              t("pricing.tier.operations.item3"),
            ],
          },
          {
            title: t("pricing.tier.enterprise"),
            price: t("pricing.tier.enterprise.price"),
            desc: t("pricing.tier.enterprise.desc"),
            list: [
              t("pricing.tier.enterprise.item1"),
              t("pricing.tier.enterprise.item2"),
              t("pricing.tier.enterprise.item3"),
            ],
          },
        ].map((tier) => (
          <div key={tier.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{tier.title}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{tier.price}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{tier.desc}</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {tier.list.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[var(--brand)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button className="mt-6 w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              {t("pricing.tier.cta")}
            </button>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: t("pricing.footer1.title"),
              desc: t("pricing.footer1.body"),
            },
            {
              title: t("pricing.footer2.title"),
              desc: t("pricing.footer2.body"),
            },
            {
              title: t("pricing.footer3.title"),
              desc: t("pricing.footer3.body"),
            },
          ].map((item) => (
            <div key={item.title}>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
