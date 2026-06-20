"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/useT";

const CheckIcon = () => (
  <svg className="h-5 w-5 shrink-0 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
  </svg>
);

export default function PricingPage() {
  const { lang } = useT();
  const isFr = lang === "fr";

  const tiers = [
    {
      name: "Starter",
      desc: isFr ? "Pour démarrer avec une petite équipe" : "For small teams getting started",
      price: isFr ? "Gratuit" : "Free",
      period: "",
      highlight: false,
      badge: null,
      cta: isFr ? "Commencer gratuitement" : "Start for free",
      ctaHref: "/register",
      ctaStyle: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",
      features: [
        { text: isFr ? "Jusqu'à 3 utilisateurs" : "Up to 3 users", included: true },
        { text: isFr ? "1 entrepôt / dépôt" : "1 warehouse / depot", included: true },
        { text: isFr ? "Catalogue jusqu'à 500 références" : "Catalog up to 500 part references", included: true },
        { text: isFr ? "Mouvements de stock" : "Stock movements", included: true },
        { text: isFr ? "Mode hors-ligne (offline-first)" : "Offline-first mode", included: true },
        { text: isFr ? "Support par email (48h)" : "Email support (48h)", included: true },
        { text: isFr ? "Multi-agences / multi-sites" : "Multi-agency / multi-site", included: false },
        { text: isFr ? "Rapports avancés & exports" : "Advanced reports & exports", included: false },
        { text: isFr ? "API & intégrations tierces" : "API & third-party integrations", included: false },
        { text: isFr ? "Rôles & permissions personnalisés" : "Custom roles & permissions", included: false },
      ],
    },
    {
      name: "Professional",
      desc: isFr ? "Pour les équipes en croissance rapide" : "For fast-growing teams",
      price: "45 000",
      period: isFr ? "FCFA / mois" : "FCFA / month",
      highlight: true,
      badge: isFr ? "Le plus populaire" : "Most popular",
      cta: isFr ? "Essai gratuit 14 jours" : "Start 14-day free trial",
      ctaHref: "/register",
      ctaStyle: "bg-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] hover:bg-blue-700",
      features: [
        { text: isFr ? "Utilisateurs illimités" : "Unlimited users", included: true },
        { text: isFr ? "Jusqu'à 10 entrepôts / agences" : "Up to 10 warehouses / agencies", included: true },
        { text: isFr ? "Catalogue illimité" : "Unlimited catalog", included: true },
        { text: isFr ? "Mouvements & historique complet" : "Full movements & audit history", included: true },
        { text: isFr ? "Mode hors-ligne (offline-first)" : "Offline-first mode", included: true },
        { text: isFr ? "Support prioritaire (4h)" : "Priority support (4h)", included: true },
        { text: isFr ? "Multi-agences / multi-sites" : "Multi-agency / multi-site", included: true },
        { text: isFr ? "Rapports avancés & exports PDF/Excel" : "Advanced reports & PDF/Excel exports", included: true },
        { text: isFr ? "API & intégrations tierces" : "API & third-party integrations", included: false },
        { text: isFr ? "Rôles & permissions personnalisés" : "Custom roles & permissions", included: false },
      ],
    },
    {
      name: "Enterprise",
      desc: isFr ? "Solutions sur-mesure pour grandes structures" : "Custom solutions for large organizations",
      price: isFr ? "Sur devis" : "Custom quote",
      period: "",
      highlight: false,
      badge: null,
      cta: isFr ? "Contacter les ventes" : "Contact sales",
      ctaHref: "/contact",
      ctaStyle: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100",
      features: [
        { text: isFr ? "Utilisateurs illimités" : "Unlimited users", included: true },
        { text: isFr ? "Entrepôts & agences illimités" : "Unlimited warehouses & agencies", included: true },
        { text: isFr ? "Catalogue illimité" : "Unlimited catalog", included: true },
        { text: isFr ? "Mouvements & historique complet" : "Full movements & audit history", included: true },
        { text: isFr ? "Mode hors-ligne (offline-first)" : "Offline-first mode", included: true },
        { text: isFr ? "Support dédié 24/7 (SLA garanti)" : "Dedicated 24/7 support (guaranteed SLA)", included: true },
        { text: isFr ? "Multi-agences / multi-sites" : "Multi-agency / multi-site", included: true },
        { text: isFr ? "Rapports avancés & exports" : "Advanced reports & exports", included: true },
        { text: isFr ? "API & intégrations tierces (ERP, SAP…)" : "API & third-party integrations (ERP, SAP…)", included: true },
        { text: isFr ? "Rôles & permissions entièrement personnalisés" : "Fully custom roles & permissions", included: true },
      ],
    },
  ];

  const faqs = [
    {
      q: isFr ? "Puis-je changer de plan à tout moment ?" : "Can I change plans at any time?",
      a: isFr ? "Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment depuis votre tableau de bord. Les ajustements sont calculés au prorata." : "Yes, you can upgrade or downgrade at any time from your dashboard. Adjustments are calculated on a pro-rata basis.",
    },
    {
      q: isFr ? "Comment fonctionne le mode hors-ligne ?" : "How does the offline mode work?",
      a: isFr ? "YowSpare utilise une architecture offline-first. Vos données sont synchronisées localement. Vous pouvez travailler en zone sans réseau (entrepôts isolés, terrain) et tout se resynchronise automatiquement dès que vous retrouvez une connexion." : "YowSpare uses an offline-first architecture. Data is synced locally. You can work in areas without network coverage (isolated warehouses, field) and everything re-syncs automatically when connectivity returns.",
    },
    {
      q: isFr ? "L'essai gratuit nécessite-t-il une carte bancaire ?" : "Does the free trial require a credit card?",
      a: isFr ? "Non. L'essai gratuit de 14 jours ne requiert aucune information de paiement. Vous ne serez facturé qu'à la fin de la période d'essai si vous choisissez de continuer." : "No. The 14-day free trial requires no payment information. You will only be charged at the end of the trial period if you choose to continue.",
    },
    {
      q: isFr ? "Mes données sont-elles en sécurité ?" : "Is my data secure?",
      a: isFr ? "Absolument. Toutes les données sont chiffrées AES-256 au repos et TLS 1.3 en transit. Nous hébergeons sur des serveurs redondants avec des sauvegardes quotidiennes. Voir notre page Sécurité pour les détails." : "Absolutely. All data is AES-256 encrypted at rest and TLS 1.3 in transit. We host on redundant servers with daily backups. See our Security page for details.",
    },
  ];

  return (
    <div className="w-full text-slate-900 dark:text-slate-100">
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-24 dark:from-slate-900/50 dark:to-transparent">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            {isFr ? "Le bon plan, pour chaque équipe" : "The right plan, for every team"}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-600 dark:text-slate-400">
            {isFr
              ? "Démarrez gratuitement, évoluez selon vos besoins. Aucun frais caché. Facturation en Franc CFA."
              : "Start for free, scale as you grow. No hidden fees. Billed in Central African Franc (FCFA)."}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1 ${
                tier.highlight
                  ? "border-2 border-blue-500 bg-white shadow-[0_8px_40px_rgba(37,99,235,0.15)] dark:bg-slate-900"
                  : "border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                  {tier.badge}
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{tier.name}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{tier.desc}</p>
                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{tier.price}</span>
                  {tier.period && (
                    <span className="ml-2 text-base font-medium text-slate-500 dark:text-slate-400">{tier.period}</span>
                  )}
                </div>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    {f.included ? <CheckIcon /> : <XIcon />}
                    <span className={f.included ? "" : "text-slate-400 dark:text-slate-600"}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.ctaHref}
                className={`mt-10 block rounded-xl px-6 py-3.5 text-center text-sm font-bold transition ${tier.ctaStyle}`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Annual discount banner */}
        <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-6 text-center dark:border-emerald-900/50 dark:bg-emerald-900/10">
          <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
            {isFr ? "Paiement annuel — Économisez jusqu'à" : "Annual billing — Save up to"}{" "}
            <span className="font-extrabold">20%</span>
          </p>
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
            {isFr
              ? "Contactez-nous pour votre devis annuel en FCFA."
              : "Contact us for your annual FCFA quote."}
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-slate-200 bg-slate-50 py-24 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">
            {isFr ? "Questions fréquentes" : "Frequently Asked Questions"}
          </h2>
          <div className="mt-12 space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-semibold text-slate-900 dark:text-white">{faq.q}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-blue-600 px-8 py-8 text-center text-white">
            <h3 className="text-2xl font-bold">
              {isFr ? "Besoin d'une offre sur-mesure ?" : "Need a custom quote?"}
            </h3>
            <p className="mt-3 text-blue-100">
              {isFr
                ? "Notre équipe commerciale est disponible pour analyser vos besoins et vous proposer une tarification adaptée."
                : "Our sales team is available to analyze your needs and offer tailored pricing."}
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
            >
              {isFr ? "Parler à un expert" : "Talk to an expert"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
