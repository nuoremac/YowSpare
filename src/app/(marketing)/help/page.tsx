"use client";

import { useT } from "@/components/i18n/useT";

export default function HelpPage() {
  const { t } = useT();

  return (
    <div className="mx-auto w-full max-w-6xl pt-12">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {t("help.label")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl dark:text-slate-100">
            {t("help.title")}
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300">
            {t("help.body")}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("help.contact.title")}</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {t("help.contact.body")}
          </p>
          <div className="mt-6 text-sm text-slate-600 dark:text-slate-300">
            <p>{t("help.contact.email")}</p>
            <p className="mt-2">{t("help.contact.response")}</p>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          {
            title: t("help.card1.title"),
            desc: t("help.card1.body"),
          },
          {
            title: t("help.card2.title"),
            desc: t("help.card2.body"),
          },
          {
            title: t("help.card3.title"),
            desc: t("help.card3.body"),
          },
        ].map((card) => (
          <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{card.title}</p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{card.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("help.faq.title")}</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {[
            {
              q: t("help.faq1.q"),
              a: t("help.faq1.a"),
            },
            {
              q: t("help.faq2.q"),
              a: t("help.faq2.a"),
            },
            {
              q: t("help.faq3.q"),
              a: t("help.faq3.a"),
            },
            {
              q: t("help.faq4.q"),
              a: t("help.faq4.a"),
            },
          ].map((item) => (
            <div key={item.q}>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.q}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
