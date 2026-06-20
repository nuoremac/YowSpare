"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/useT";

export default function AboutPage() {
  const { lang } = useT();
  const isFr = lang === "fr";

  const values = [
    {
      icon: "01",
      title: isFr ? "Orienté terrain" : "Field-oriented",
      desc: isFr
        ? "Nous concevons pour les techniciens sur le terrain, pas pour les bureaux climatisés. L'interface doit fonctionner avec des gants, sous le soleil, sans réseau."
        : "We design for technicians in the field, not air-conditioned offices. The interface must work with gloves on, under the sun, without a network.",
    },
    {
      icon: "02",
      title: isFr ? "Offline d'abord" : "Offline-first",
      desc: isFr
        ? "Dans les pays à connectivité variable, le mode hors-ligne n'est pas une option — c'est la fonctionnalité principale. Chaque décision d'architecture en découle."
        : "In countries with variable connectivity, offline mode is not an option — it's the core feature. Every architecture decision flows from this.",
    },
    {
      icon: "03",
      title: isFr ? "Confiance radicale" : "Radical trust",
      desc: isFr
        ? "Nos clients nous confient leurs actifs les plus précieux. Nous répondons avec une transparence totale sur nos pratiques de sécurité et de données."
        : "Our clients entrust us with their most valuable assets. We respond with full transparency about our security and data practices.",
    },
    {
      icon: "04",
      title: isFr ? "Conçu pour l'Afrique" : "Built for Africa",
      desc: isFr
        ? "YowSpare est conçu et optimisé pour les contraintes réelles du marché africain : infrastructure réseau variable, paiement en FCFA, support en français."
        : "YowSpare is designed and optimized for the real constraints of the African market: variable network infrastructure, FCFA payments, French-language support.",
    },
  ];

  const team = [
    { name: "Raoul Ossombo", role: isFr ? "Fondateur & CEO" : "Founder & CEO", initials: "RO", color: "bg-blue-600" },
    { name: "Équipe Technique", role: isFr ? "Ingénieurs Backend / Frontend" : "Backend / Frontend Engineers", initials: "YT", color: "bg-emerald-600" },
    { name: "Conseil Produit", role: isFr ? "Experts MRO & Maintenance" : "MRO & Maintenance Experts", initials: "MRO", color: "bg-violet-600" },
  ];

  const milestones = [
    { year: "2024", event: isFr ? "Naissance de l'idée — frustration face aux GMAO existants sur le marché camerounais" : "Birth of the idea — frustration with existing CMMS on the Cameroonian market" },
    { year: "2025", event: isFr ? "Développement du prototype, tests terrain avec des équipes de maintenance industrielle" : "Prototype development, field testing with industrial maintenance teams" },
    { year: "2026", event: isFr ? "Lancement de YowSpare v1 — plateforme offline-first multi-tenant" : "Launch of YowSpare v1 — offline-first multi-tenant platform" },
  ];

  return (
    <div className="w-full text-slate-900 dark:text-slate-100">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          {isFr ? "Nous modernisons la maintenance industrielle africaine" : "We're modernizing African industrial maintenance"}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-600 dark:text-slate-400">
          {isFr
            ? "YowSpare est né d'une conviction simple : les équipes de maintenance en Afrique méritent des outils aussi puissants et modernes que ceux utilisés dans les grandes industries mondiales."
            : "YowSpare was born from a simple conviction: maintenance teams in Africa deserve tools as powerful and modern as those used in the world's leading industries."}
        </p>
      </section>

      {/* Problem / Solution */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                {isFr ? "Le problème que nous résolvons" : "The problem we're solving"}
              </h2>
              <div className="mt-6 space-y-4 text-slate-600 dark:text-slate-300">
                <p>
                  {isFr
                    ? "Dans les entrepôts, chantiers, et sites industriels d'Afrique centrale, la gestion des pièces détachées se fait encore sur papier, dans des tableurs Excel, ou avec des logiciels GMAO hors de prix, complexes, et inadaptés au contexte local."
                    : "In warehouses, construction sites, and industrial facilities across Central Africa, spare parts management is still done on paper, in Excel spreadsheets, or with overpriced CMMS software that is complex and ill-adapted to the local context."}
                </p>
                <p>
                  {isFr
                    ? "Le résultat : des ruptures de stock imprévues, des temps d'arrêt machine prolongés, des coûts de maintenance incontrôlés, et une traçabilité nulle."
                    : "The result: unexpected stockouts, prolonged machine downtime, uncontrolled maintenance costs, and zero traceability."}
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {isFr ? "Notre réponse" : "Our answer"}
              </h3>
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                {isFr
                  ? "Une plateforme SaaS légère, offline-first, multilingue, facturée en FCFA, et conçue pour fonctionner sur du matériel standard. YowSpare s'adapte à votre environnement — pas l'inverse."
                  : "A lightweight, offline-first, multilingual SaaS platform, billed in FCFA, and designed to run on standard hardware. YowSpare adapts to your environment — not the other way around."}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                {[
                  { label: isFr ? "Pièces gérées" : "Parts managed", value: "10 000+" },
                  { label: isFr ? "Mouvements / mois" : "Movements / month", value: "50 000+" },
                  { label: isFr ? "Uptime garanti" : "Uptime guaranteed", value: "99.9%" },
                  { label: isFr ? "Support (délai)" : "Support response", value: "< 4h" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{stat.value}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          {isFr ? "Nos Valeurs" : "Our Values"}
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{v.icon}</div>
              <h3 className="mt-4 text-lg font-bold">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t border-slate-200 bg-slate-50 py-24 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">
            {isFr ? "Notre Histoire" : "Our Story"}
          </h2>
          <div className="mt-12 space-y-8">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shrink-0">{m.year}</div>
                  {i < milestones.length - 1 && <div className="mt-2 h-full w-0.5 bg-slate-200 dark:bg-slate-800" />}
                </div>
                <div className="pb-8 pt-2">
                  <p className="text-slate-700 dark:text-slate-300">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">
          {isFr ? "L'équipe derrière YowSpare" : "The team behind YowSpare"}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-400">
          {isFr
            ? "Une équipe pluridisciplinaire alliant expertise technique et connaissance du terrain industriel africain."
            : "A multidisciplinary team combining technical expertise and knowledge of African industrial field operations."}
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
          {team.map((member) => (
            <div key={member.name} className="flex flex-col items-center gap-3">
              <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${member.color} text-2xl font-bold text-white shadow-md`}>
                {member.initials}
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{member.name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16">
          <Link href="/contact" className="inline-block rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-md transition hover:bg-blue-700">
            {isFr ? "Nous contacter" : "Get in touch"}
          </Link>
        </div>
      </section>
    </div>
  );
}
