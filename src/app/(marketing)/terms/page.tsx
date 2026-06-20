"use client";

import { useT } from "@/components/i18n/useT";

export default function TermsPage() {
  const { lang } = useT();
  const isFr = lang === "fr";

  const sections = isFr ? [
    {
      title: "1. Objet",
      body: "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme SaaS YowSpare (ci-après « le Service »), éditée par la société YowSpare, Yaoundé, Cameroun. Toute utilisation du Service implique l'acceptation pleine et entière des présentes CGU.",
    },
    {
      title: "2. Description du Service",
      body: "YowSpare est une plateforme de gestion de stock de pièces détachées (MRO) accessible via navigateur web et application mobile. Le Service comprend : gestion du catalogue, mouvements de stock, gestion des utilisateurs et des agences, rapports et exports, mode de fonctionnement hors-ligne (offline-first), et API RESTful. YowSpare se réserve le droit de modifier ou d'interrompre tout ou partie du Service avec un préavis de 30 jours.",
    },
    {
      title: "3. Accès et compte utilisateur",
      body: "L'accès au Service requiert la création d'un compte avec une adresse email professionnelle valide. L'Utilisateur est responsable de la confidentialité de ses identifiants. En cas de compromission suspectée, il doit immédiatement notifier YowSpare à support@yowspare.com. YowSpare se réserve le droit de suspendre tout compte dont l'utilisation serait contraire aux présentes CGU ou à la législation en vigueur.",
    },
    {
      title: "4. Abonnement et tarification",
      body: "Le Service est proposé selon les formules décrites sur la page Tarifs : Starter (gratuit), Professional (45 000 FCFA/mois HT), Enterprise (sur devis). Les tarifs sont exprimés en Franc CFA (XAF). La facturation s'effectue mensuellement ou annuellement selon l'option choisie. Tout abonnement commencé est dû dans son intégralité. YowSpare se réserve le droit de modifier ses tarifs avec un préavis de 30 jours.",
    },
    {
      title: "5. Propriété intellectuelle",
      body: "L'ensemble des éléments constituant le Service (code source, interface, marque YowSpare, documentation) est la propriété exclusive de YowSpare ou de ses partenaires. Toute reproduction, modification, distribution ou exploitation sans autorisation écrite préalable est strictement interdite. Les données saisies par le Client restent sa propriété exclusive.",
    },
    {
      title: "6. Données du Client",
      body: "YowSpare agit en qualité de sous-traitant au sens du RGPD et de la Loi camerounaise n° 2010/012 pour les données saisies par le Client. Le Client est responsable de traitement de ses propres données. YowSpare ne consulte ces données que pour des fins de support technique avec autorisation explicite du Client. Voir la Politique de Confidentialité pour les détails.",
    },
    {
      title: "7. Disponibilité et SLA",
      body: "YowSpare s'engage à maintenir une disponibilité du Service de 99,9% par mois (hors maintenance planifiée). En cas de dépassement, le Client peut bénéficier d'un crédit de service calculé au prorata. Les maintenances planifiées sont communiquées avec 48h de préavis. L'architecture offline-first garantit une continuité d'accès aux données en cas d'indisponibilité du réseau.",
    },
    {
      title: "8. Limitation de responsabilité",
      body: "YowSpare ne saurait être tenu responsable de : pertes indirectes, manque à gagner, perte de données résultant d'une mauvaise utilisation du Service ; dommages causés par des tiers, des interruptions de réseau, ou des événements de force majeure. La responsabilité maximale de YowSpare est limitée au montant total des sommes versées par le Client au cours des 12 derniers mois.",
    },
    {
      title: "9. Résiliation",
      body: "Le Client peut résilier son abonnement à tout moment depuis son tableau de bord, avec effet à la fin de la période de facturation en cours. YowSpare peut résilier un abonnement en cas de violation des CGU avec un préavis de 15 jours, ou immédiatement en cas de fraude avérée. Après résiliation, les données sont conservées 90 jours puis définitivement supprimées, sauf demande d'export préalable.",
    },
    {
      title: "10. Loi applicable et juridiction",
      body: "Les présentes CGU sont soumises au droit camerounais. Tout litige relatif à leur interprétation ou exécution sera soumis aux juridictions compétentes de Yaoundé, Cameroun, après tentative de résolution amiable dans un délai de 30 jours.",
    },
  ] : [
    {
      title: "1. Purpose",
      body: "These Terms of Service (ToS) govern access to and use of the YowSpare SaaS platform (hereinafter 'the Service'), published by YowSpare, Yaoundé, Cameroon. Any use of the Service implies full and unconditional acceptance of these ToS.",
    },
    {
      title: "2. Service Description",
      body: "YowSpare is a spare parts inventory management (MRO) platform accessible via web browser and mobile application. The Service includes: catalog management, stock movements, user and agency management, reports and exports, offline-first operation mode, and RESTful API. YowSpare reserves the right to modify or discontinue all or part of the Service with 30 days' notice.",
    },
    {
      title: "3. Account Access",
      body: "Access to the Service requires creating an account with a valid professional email address. The User is responsible for the confidentiality of their credentials. In case of suspected compromise, they must immediately notify YowSpare at support@yowspare.com. YowSpare reserves the right to suspend any account whose use is contrary to these ToS or applicable law.",
    },
    {
      title: "4. Subscription and Pricing",
      body: "The Service is offered according to the plans described on the Pricing page: Starter (free), Professional (45,000 FCFA/month excl. tax), Enterprise (custom quote). Prices are expressed in Central African Franc (XAF). Billing occurs monthly or annually depending on the selected option. Any subscription started is due in full. YowSpare reserves the right to change its prices with 30 days' notice.",
    },
    {
      title: "5. Intellectual Property",
      body: "All elements constituting the Service (source code, interface, YowSpare brand, documentation) are the exclusive property of YowSpare or its partners. Any reproduction, modification, distribution or exploitation without prior written authorization is strictly prohibited. Data entered by the Customer remains their exclusive property.",
    },
    {
      title: "6. Customer Data",
      body: "YowSpare acts as a data processor within the meaning of GDPR and Cameroonian Law No. 2010/012 for data entered by the Customer. The Customer is the data controller for their own data. YowSpare only accesses this data for technical support purposes with the Customer's explicit authorization. See the Privacy Policy for details.",
    },
    {
      title: "7. Availability and SLA",
      body: "YowSpare commits to maintaining 99.9% Service availability per month (excluding planned maintenance). In the event of a breach, the Customer may receive a service credit calculated on a pro-rata basis. Planned maintenance is communicated with 48 hours' notice. The offline-first architecture guarantees continued access to data in case of network unavailability.",
    },
    {
      title: "8. Limitation of Liability",
      body: "YowSpare shall not be liable for: indirect losses, loss of profit, data loss resulting from improper use of the Service; damages caused by third parties, network interruptions, or force majeure events. YowSpare's maximum liability is limited to the total amount paid by the Customer over the last 12 months.",
    },
    {
      title: "9. Termination",
      body: "The Customer may terminate their subscription at any time from their dashboard, effective at the end of the current billing period. YowSpare may terminate a subscription in case of ToS violation with 15 days' notice, or immediately in case of proven fraud. After termination, data is retained for 90 days then permanently deleted, unless a prior export request is made.",
    },
    {
      title: "10. Governing Law and Jurisdiction",
      body: "These ToS are governed by Cameroonian law. Any dispute relating to their interpretation or execution shall be submitted to the competent courts of Yaoundé, Cameroon, after an attempt at amicable resolution within 30 days.",
    },
  ];

  return (
    <div className="w-full text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-24">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 dark:border-slate-800">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {isFr ? "Conditions Générales d'Utilisation" : "Terms of Service"}
          </h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>{isFr ? "Version 1.0 — 19 juin 2026" : "Version 1.0 — June 19, 2026"}</span>
            <span>{isFr ? "Droit camerounais applicable" : "Governed by Cameroonian law"}</span>
          </div>
        </div>

        {/* Intro */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-900/10">
          <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
            <strong>{isFr ? "Important : " : "Important: "}</strong>
            {isFr
              ? "En créant un compte YowSpare, vous reconnaissez avoir lu, compris et accepté l'intégralité des présentes Conditions Générales d'Utilisation ainsi que notre Politique de Confidentialité."
              : "By creating a YowSpare account, you acknowledge having read, understood, and accepted these Terms of Service in their entirety, as well as our Privacy Policy."}
          </p>
        </div>

        {/* Sections */}
        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={i} className="border-b border-slate-100 pb-8 last:border-0 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{s.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.body}</p>
            </section>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-xl font-bold">{isFr ? "Questions juridiques ?" : "Legal questions?"}</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {isFr ? "Contactez notre équipe juridique pour toute demande spécifique." : "Contact our legal team for any specific request."}
          </p>
          <a href="mailto:legal@yowspare.com" className="mt-4 inline-block rounded-xl bg-slate-900 px-8 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
            legal@yowspare.com
          </a>
        </div>
      </div>
    </div>
  );
}
