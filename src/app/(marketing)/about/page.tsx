"use client";

import { useT } from "@/components/i18n/useT";

export default function AboutPage() {
  const { t } = useT();

  return (
    <div className="mx-auto w-full max-w-6xl pt-12">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {t("about.label")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl dark:text-slate-100">
            {t("about.title")}
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300">
            {t("about.body")}
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
              {t("about.chip.offline")}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
              {t("about.chip.audit")}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
              {t("about.chip.multiSite")}
            </span>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("about.mission.title")}</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {t("about.mission.body")}
          </p>
          <div className="mt-6 grid gap-4">
            {[
              t("about.mission.point1"),
              t("about.mission.point2"),
              t("about.mission.point3"),
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="mt-1 h-2 w-2 rounded-full bg-[var(--brand)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          {
            title: t("about.card1.title"),
            desc: t("about.card1.body"),
          },
          {
            title: t("about.card2.title"),
            desc: t("about.card2.body"),
          },
          {
            title: t("about.card3.title"),
            desc: t("about.card3.body"),
          },
        ].map((card) => (
          <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{card.title}</p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{card.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">2019</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t("about.timeline.2019")}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">2022</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t("about.timeline.2022")}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">2025</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t("about.timeline.2025")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
