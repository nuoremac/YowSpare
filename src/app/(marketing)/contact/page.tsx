"use client";

import { useT } from "@/components/i18n/useT";

export default function ContactPage() {
  const { t } = useT();

  return (
    <div className="mx-auto w-full max-w-6xl pt-12">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {t("contact.label")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl dark:text-slate-100">
            {t("contact.title")}
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300">
            {t("contact.body")}
          </p>
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("contact.hq.title")}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("contact.hq.location")}</p>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{t("contact.hq.email")}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("contact.hq.phone")}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("contact.form.title")}</p>
          <form className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t("contact.form.name")}</label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder={t("contact.form.name.placeholder")}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t("contact.form.email")}</label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder={t("contact.form.email.placeholder")}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t("contact.form.company")}</label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder={t("contact.form.company.placeholder")}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t("contact.form.message")}</label>
              <textarea
                className="mt-2 min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder={t("contact.form.message.placeholder")}
              />
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-strong)]"
            >
              {t("contact.form.send")}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          {
            title: t("contact.card1.title"),
            desc: t("contact.card1.body"),
          },
          {
            title: t("contact.card2.title"),
            desc: t("contact.card2.body"),
          },
          {
            title: t("contact.card3.title"),
            desc: t("contact.card3.body"),
          },
        ].map((card) => (
          <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{card.title}</p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{card.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
