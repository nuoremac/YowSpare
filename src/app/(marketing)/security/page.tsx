"use client";

import { useT } from "@/components/i18n/useT";

export default function SecurityPage() {
  const { t } = useT();

  return (
    <div className="mx-auto w-full max-w-6xl pt-12">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {t("security.label")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl dark:text-slate-100">
            {t("security.title")}
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300">
            {t("security.body")}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("security.compliance.title")}</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {t("security.compliance.body")}
          </p>
          <div className="mt-6 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[var(--brand)]" />
              <span>{t("security.compliance.item1")}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[var(--brand)]" />
              <span>{t("security.compliance.item2")}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[var(--brand)]" />
              <span>{t("security.compliance.item3")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          {
            title: t("security.card1.title"),
            desc: t("security.card1.body"),
          },
          {
            title: t("security.card2.title"),
            desc: t("security.card2.body"),
          },
          {
            title: t("security.card3.title"),
            desc: t("security.card3.body"),
          },
        ].map((card) => (
          <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{card.title}</p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{card.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("security.practices.title")}</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {[
            {
              title: t("security.practice1.title"),
              desc: t("security.practice1.body"),
            },
            {
              title: t("security.practice2.title"),
              desc: t("security.practice2.body"),
            },
            {
              title: t("security.practice3.title"),
              desc: t("security.practice3.body"),
            },
            {
              title: t("security.practice4.title"),
              desc: t("security.practice4.body"),
            },
          ].map((item) => (
            <div key={item.title}>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
