"use client";

import Link from "next/link";
import Image from "next/image";
import MarketingShell from "@/components/MarketingShell";
import { useT } from "@/components/i18n/useT";
import { withAppBasePath } from "@/lib/basePath";

const pageCopy = {
  en: {
    hero: {
      title: "Keep critical spare parts available before downtime starts.",
      body:
        "YowSpare connects inventory, warehouse locations, internal requests, suppliers, RFQs, purchase orders, and approvals in one offline-first workspace built for industrial teams.",
      primary: "Start free",
      secondary: "Book a demo",
      proof: "Built for warehouses, workshops, plants, depots, and field maintenance teams.",
    },
    stats: [
      ["30%", "less emergency purchasing"],
      ["99.9%", "traceable stock decisions"],
      ["Offline", "work continues without network"],
      ["Multi-site", "one view across agencies"],
    ],
    modulesTitle: "One operating system for the spare-parts lifecycle.",
    modulesBody:
      "Replace scattered spreadsheets and disconnected requests with workflows that match how maintenance and procurement teams actually work.",
    modules: [
      ["Inventory control", "Track stock levels, reorder points, categories, and product locations."],
      ["Warehouse map", "Locate each part by agency, bin, shelf, and warehouse zone."],
      ["Procurement", "Create RFQs, compare suppliers, and convert accepted quotations into POs."],
      ["Internal requests", "Let departments request parts with approval and consumption history."],
      ["Work orders", "Prepare spare parts for maintenance jobs and record real consumption."],
      ["Approvals", "Protect write actions with roles, permissions, and audit trails."],
      ["Supplier directory", "Maintain supplier contacts, lead times, MOQs, and preferred parts."],
      ["Traceability", "Follow every purchase, receipt, movement, adjustment, and exception."],
    ],
    benefits: {
      title: "Designed for the reality of industrial operations.",
      body:
        "Connectivity drops, warehouses are busy, and parts move fast. YowSpare keeps the process usable in those conditions.",
      items: [
        ["Offline-first execution", "Users keep working in low-connectivity warehouses, then synchronize when the network returns."],
        ["Permission-aware workflows", "Pages stay visible for everyone, but read/write actions follow each role's permissions."],
        ["Financial-ready procurement", "Quotations and purchase orders include VAT, AIR, IR, supplier references, and print-ready documents."],
      ],
    },
    final: {
      title: "Ready to make spare-parts operations easier to control?",
      body: "Create a workspace or talk to us about your warehouse and approval structure.",
      primary: "Create workspace",
      secondary: "Contact sales",
    },
  },
  fr: {
    hero: {
      title: "Gardez les pieces critiques disponibles avant que l'arret machine commence.",
      body:
        "YowSpare relie inventaire, emplacements warehouse, demandes internes, fournisseurs, cotations, bons de commande et approbations dans un espace offline-first pense pour l'industrie.",
      primary: "Demarrer",
      secondary: "Reserver une demo",
      proof: "Concu pour entrepots, ateliers, usines, depots et equipes terrain.",
    },
    stats: [
      ["30%", "moins d'achats urgents"],
      ["99,9%", "decisions stock tracables"],
      ["Hors ligne", "le travail continue sans reseau"],
      ["Multi-site", "une vue sur toutes les agences"],
    ],
    modulesTitle: "Un systeme d'exploitation pour le cycle de vie des pieces.",
    modulesBody:
      "Remplacez les tableurs et demandes dispersees par des workflows adaptes aux equipes maintenance et achats.",
    modules: [
      ["Controle inventaire", "Suivez niveaux de stock, seuils, categories et emplacements produit."],
      ["Carte warehouse", "Localisez chaque piece par agence, bin, et zone d'entrepot."],
      ["Approvisionnement", "Creez les cotations, comparez les fournisseurs et convertissez en bons de commande."],
      ["Demandes internes", "Les departements demandent les pieces avec validation et historique."],
      ["Ordres de maintenance", "Preparez les pieces pour les interventions et enregistrez la consommation."],
      ["Approbations", "Protegez les actions d'ecriture avec roles, permissions et audits."],
      ["Fournisseurs", "Gardez contacts, delais, MOQ et pieces preferees par fournisseur."],
      ["Tracabilite", "Suivez achats, receptions, mouvements, ajustements et exceptions."],
    ],
    benefits: {
      title: "Concu pour la realite des operations industrielles.",
      body:
        "Le reseau tombe, les entrepots bougent vite, les pieces sortent en urgence. YowSpare reste utilisable dans ces conditions.",
      items: [
        ["Execution offline-first", "Les utilisateurs travaillent en zone de faible reseau puis synchronisent automatiquement."],
        ["Workflows par permission", "Les pages restent visibles, mais les actions lecture/ecriture suivent le role de chacun."],
        ["Achats prets finance", "Cotations et POs incluent TVA, AIR, IR, references fournisseur et documents imprimables."],
      ],
    },
    final: {
      title: "Pret a mieux controler vos operations spare ?",
      body: "Creez un espace de travail ou parlons de vos entrepots et circuits d'approbation.",
      primary: "Creer un workspace",
      secondary: "Contacter les ventes",
    },
  },
} as const;

const Icon = ({ index }: { index: number }) => {
  const paths = [
    <path key="0" d="M4 7h7v7H4zM13 4h7v6h-7zM13 12h7v8h-7zM4 16h7v4H4z" strokeLinecap="round" />,
    <path key="1" d="M4 20V5h16v15M8 9h2M8 13h2M14 9h2M14 13h2M7 20v-4h10v4" strokeLinecap="round" />,
    <path key="2" d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />,
    <path key="3" d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h3" strokeLinecap="round" />,
    <path key="4" d="M4 20h16M7 17V7h10v10M9 10h6M9 14h6" strokeLinecap="round" />,
    <path key="5" d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7l7-4zM9.5 12.5l1.8 1.8 3.2-3.2" strokeLinecap="round" />,
    <path key="6" d="M5 8h14M7 8v11h10V8M9 5h6l1 3H8l1-3z" strokeLinecap="round" />,
    <path key="7" d="M4 20V4h16M7 16l4-4 3 2 4-6" strokeLinecap="round" />,
  ];
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      {paths[index % paths.length]}
    </svg>
  );
};

export default function AuthClient() {
  const { lang } = useT();
  const c = pageCopy[lang];

  return (
    <MarketingShell>
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 pb-16 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-20 lg:pt-20">
        <div>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            {c.hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            {c.hero.body}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
              {c.hero.primary}
            </Link>
            <Link href="/contact" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
              {c.hero.secondary}
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">{c.hero.proof}</p>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <Image
              src={withAppBasePath("/icons/yowspare_3d_hero.png")}
              alt="YowSpare warehouse, inventory, and procurement workspace"
              width={1200}
              height={900}
              priority
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/30 bg-white/90 p-4 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {c.stats.map(([value, label]) => (
                <div key={label}>
                  <div className="text-lg font-extrabold text-slate-950 dark:text-white">{value}</div>
                  <div className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">{c.modulesTitle}</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{c.modulesBody}</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.modules.map(([title, body], index) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 dark:border-slate-800 dark:bg-slate-950">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  <Icon index={index} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Image
            src={withAppBasePath("/icons/spare1.png")}
            alt="Spare parts warehouse operations"
            width={1200}
            height={900}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">{c.benefits.title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{c.benefits.body}</p>
          <div className="mt-8 space-y-4">
            {c.benefits.items.map(([title, body]) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-2xl bg-blue-600 px-6 py-12 text-center text-white shadow-sm">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{c.final.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-blue-100">{c.final.body}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-blue-700 transition hover:bg-blue-50">
              {c.final.primary}
            </Link>
            <Link href="/contact" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-6 text-sm font-bold text-white transition hover:bg-white/10">
              {c.final.secondary}
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
