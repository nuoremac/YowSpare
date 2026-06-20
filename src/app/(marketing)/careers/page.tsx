"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/useT";

export default function CareersPage() {
  const { lang } = useT();
  const isFr = lang === "fr";

  const perks = [
    { icon: "IM", title: isFr ? "Impact réel" : "Real impact", desc: isFr ? "Vos contributions améliorent directement la vie des techniciens de maintenance à travers l'Afrique centrale." : "Your contributions directly improve the lives of maintenance technicians across Central Africa." },
    { icon: "RM", title: isFr ? "Télétravail flexible" : "Flexible remote", desc: isFr ? "Travaillez d'où vous le souhaitez, avec des réunions d'équipe hebdomadaires et des sprints bien cadrés." : "Work from wherever you want, with weekly team meetings and well-structured sprints." },
    { icon: "GR", title: isFr ? "Croissance rapide" : "Fast growth", desc: isFr ? "Rejoignez une startup en phase de lancement avec des opportunités rapides d'évolution et de responsabilité." : "Join an early-stage startup with fast opportunities for growth and ownership." },
    { icon: "FC", title: isFr ? "Rémunération compétitive" : "Competitive pay", desc: isFr ? "Salaires compétitifs en FCFA, revus annuellement. Participation aux parts de l'entreprise pour les premiers membres." : "Competitive FCFA salaries, reviewed annually. Equity participation for early team members." },
  ];

  const jobs = [
    {
      title: isFr ? "Ingénieur Backend Senior (Java / Spring Boot)" : "Senior Backend Engineer (Java / Spring Boot)",
      type: isFr ? "Temps plein · Télétravail" : "Full-time · Remote",
      tags: ["Java", "Spring Boot", "R2DBC", "PostgreSQL"],
      desc: isFr
        ? "Renforcer notre architecture réactive (R2DBC), améliorer les performances de synchronisation offline, et contribuer à la sécurité multi-tenant."
        : "Strengthen our reactive architecture (R2DBC), improve offline sync performance, and contribute to multi-tenant security.",
    },
    {
      title: isFr ? "Ingénieur Frontend Senior (Next.js / TypeScript)" : "Senior Frontend Engineer (Next.js / TypeScript)",
      type: isFr ? "Temps plein · Télétravail" : "Full-time · Remote",
      tags: ["Next.js", "TypeScript", "Tailwind CSS", "React"],
      desc: isFr
        ? "Concevoir et implémenter de nouvelles fonctionnalités sur notre dashboard, améliorer les performances et l'expérience utilisateur mobile."
        : "Design and implement new features on our dashboard, improve performance and mobile user experience.",
    },
    {
      title: isFr ? "Responsable Commercial (Yaoundé / Douala)" : "Sales Manager (Yaoundé / Douala)",
      type: isFr ? "Temps plein · Présentiel Cameroun" : "Full-time · On-site Cameroon",
      tags: [isFr ? "B2B" : "B2B", "MRO", "CRM", "FCFA"],
      desc: isFr
        ? "Développer notre portefeuille clients dans les secteurs industriels, miniers et pétroliers au Cameroun et en Afrique centrale."
        : "Grow our client portfolio in industrial, mining, and oil sectors across Cameroon and Central Africa.",
    },
    {
      title: isFr ? "Chargé(e) de Support Technique" : "Technical Support Specialist",
      type: isFr ? "Temps partiel · Hybride" : "Part-time · Hybrid",
      tags: [isFr ? "Support" : "Support", "Formation", "GMAO", "Français"],
      desc: isFr
        ? "Accompagner nos clients dans la prise en main de YowSpare, répondre aux tickets et produire de la documentation utilisateur."
        : "Support our customers in onboarding YowSpare, handle tickets, and produce user documentation.",
    },
  ];

  return (
    <div className="w-full text-slate-900 dark:text-slate-100">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          {isFr ? "Construisons l'avenir ensemble" : "Let's build the future together"}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-600 dark:text-slate-400">
          {isFr
            ? "YowSpare est une startup tech camerounaise en pleine croissance. Nous cherchons des talents passionnés qui veulent avoir un impact réel sur l'industrie africaine."
            : "YowSpare is a fast-growing Cameroonian tech startup. We're looking for passionate talent who want to make a real impact on African industry."}
        </p>
      </section>

      {/* Perks */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">
            {isFr ? "Pourquoi nous rejoindre ?" : "Why join us?"}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{p.icon}</div>
                <h3 className="mt-3 font-bold text-slate-900 dark:text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="text-3xl font-extrabold tracking-tight">
          {isFr ? "Postes Ouverts" : "Open Positions"}
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {isFr ? `${jobs.length} postes disponibles` : `${jobs.length} positions available`}
        </p>
        <div className="mt-8 flex flex-col gap-4">
          {jobs.map((job) => (
            <div key={job.title} className="rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-[0_4px_20px_rgba(37,99,235,0.1)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{job.title}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{job.type}</p>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{job.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.tags.map(tag => (
                      <span key={tag} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  {isFr ? "Postuler" : "Apply"}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-xl font-bold">{isFr ? "Vous ne trouvez pas votre profil ?" : "Don't see your profile?"}</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {isFr
              ? "Envoyez-nous une candidature spontanée. Nous la gardons dans nos dossiers et vous contactons dès qu'une opportunité se présente."
              : "Send us an open application. We keep it on file and contact you as soon as an opportunity arises."}
          </p>
          <Link href="/contact" className="mt-6 inline-block rounded-xl bg-slate-900 px-8 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
            {isFr ? "Candidature spontanée" : "Open application"}
          </Link>
        </div>
      </section>
    </div>
  );
}
