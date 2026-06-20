"use client";

import { useT } from "@/components/i18n/useT";

export default function PrivacyPage() {
  const { lang } = useT();
  const isFr = lang === "fr";

  const sections = isFr ? [
    {
      title: "1. Identification du responsable de traitement",
      body: "YowSpare (ci-après « la Société ») est responsable du traitement des données personnelles collectées via la plateforme yowspare.com. Pour toute question relative à vos données, contactez-nous à : privacy@yowspare.com.",
    },
    {
      title: "2. Données collectées",
      body: "Nous collectons les données strictement nécessaires au fonctionnement de notre service : (a) Données de compte : nom, prénom, adresse email professionnelle, mot de passe haché ; (b) Données d'organisation : nom de l'entreprise, secteur d'activité, nombre d'utilisateurs ; (c) Données d'inventaire : références de pièces, quantités, mouvements de stock — saisies par vos équipes ; (d) Données techniques : adresses IP, type de navigateur, horodatages de connexion, pour des fins de sécurité et d'audit.",
    },
    {
      title: "3. Finalités et bases légales",
      body: "Vos données sont traitées pour : l'exécution du contrat d'abonnement (Art. 6-1-b RGPD) ; la sécurité et la prévention des fraudes (intérêt légitime — Art. 6-1-f RGPD) ; l'amélioration du service par analyse d'usage agrégée et anonymisée (intérêt légitime) ; l'envoi de communications relatives au service (notifications transactionnelles).",
    },
    {
      title: "4. Conservation des données",
      body: "Les données de compte sont conservées pendant la durée de l'abonnement + 3 ans après résiliation, conformément aux obligations légales camerounaises (Loi n° 2010/012 du 21 décembre 2010). Les logs d'audit sont conservés 7 ans. Les données peuvent être effacées sur demande, sauf obligation légale contraire.",
    },
    {
      title: "5. Sécurité",
      body: "L'ensemble des données est chiffré au repos (AES-256) et en transit (TLS 1.3). L'accès aux données de production est restreint par des contrôles d'accès stricts. Nous effectuons des audits de sécurité réguliers. En cas de violation de données, vous serez notifié dans les 72 heures conformément aux réglementations applicables.",
    },
    {
      title: "6. Partage des données",
      body: "Nous ne vendons jamais vos données à des tiers. Nous pouvons partager des données avec des sous-traitants techniques (hébergement, envoi d'emails) dans le cadre de contrats de traitement conformes. Chaque sous-traitant est soumis à des clauses contractuelles de protection des données.",
    },
    {
      title: "7. Vos droits",
      body: "Conformément au RGPD et à la loi camerounaise sur la protection des données, vous disposez des droits suivants : droit d'accès, de rectification, d'effacement (« droit à l'oubli »), de portabilité, d'opposition au traitement, de limitation du traitement. Pour exercer ces droits, contactez : privacy@yowspare.com.",
    },
    {
      title: "8. Cookies",
      body: "Nous utilisons uniquement des cookies strictement nécessaires au fonctionnement de la session et à la sécurité (token d'authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.",
    },
  ] : [
    {
      title: "1. Data Controller",
      body: "YowSpare (hereinafter 'the Company') is responsible for processing the personal data collected through the platform yowspare.com. For any questions regarding your data, contact us at: privacy@yowspare.com.",
    },
    {
      title: "2. Data Collected",
      body: "We collect data strictly necessary to operate our service: (a) Account data: first name, last name, professional email address, hashed password; (b) Organization data: company name, industry, number of users; (c) Inventory data: part references, quantities, stock movements — entered by your teams; (d) Technical data: IP addresses, browser type, login timestamps, for security and audit purposes.",
    },
    {
      title: "3. Purposes and Legal Basis",
      body: "Your data is processed for: execution of the subscription contract (Art. 6-1-b GDPR); security and fraud prevention (legitimate interest — Art. 6-1-f GDPR); service improvement through aggregated and anonymized usage analysis (legitimate interest); sending service-related communications (transactional notifications).",
    },
    {
      title: "4. Data Retention",
      body: "Account data is retained for the duration of the subscription + 3 years after termination, in accordance with Cameroonian legal obligations (Law No. 2010/012 of December 21, 2010). Audit logs are retained for 7 years. Data can be deleted upon request, unless legally required otherwise.",
    },
    {
      title: "5. Security",
      body: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Access to production data is restricted by strict access controls. We conduct regular security audits. In the event of a data breach, you will be notified within 72 hours in accordance with applicable regulations.",
    },
    {
      title: "6. Data Sharing",
      body: "We never sell your data to third parties. We may share data with technical sub-processors (hosting, email delivery) under compliant data processing agreements. Each sub-processor is bound by contractual data protection clauses.",
    },
    {
      title: "7. Your Rights",
      body: "In accordance with GDPR and Cameroonian data protection law, you have the following rights: right of access, rectification, erasure ('right to be forgotten'), portability, objection to processing, restriction of processing. To exercise these rights, contact: privacy@yowspare.com.",
    },
    {
      title: "8. Cookies",
      body: "We only use cookies strictly necessary for session operation and security (authentication token). No advertising or third-party tracking cookies are used.",
    },
  ];

  return (
    <div className="w-full text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-24">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 dark:border-slate-800">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {isFr ? "Politique de Confidentialité" : "Privacy Policy"}
          </h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>{isFr ? "Derniere mise a jour : 19 juin 2026" : "Last updated: June 19, 2026"}</span>
            <span>{isFr ? "Applicable au Cameroun & Zone CEMAC" : "Applicable in Cameroon & CEMAC Zone"}</span>
          </div>
        </div>

        {/* Intro */}
        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/50 dark:bg-blue-900/10">
          <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-300">
            {isFr
              ? "Chez YowSpare, nous croyons que la confiance se construit sur la transparence. Cette politique de confidentialité décrit de façon claire et précise comment nous collectons, utilisons, protégeons et partageons vos données personnelles."
              : "At YowSpare, we believe trust is built on transparency. This privacy policy clearly and precisely describes how we collect, use, protect, and share your personal data."}
          </p>
        </div>

        {/* Sections */}
        <div className="mt-10 space-y-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{s.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.body}</p>
            </section>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-xl font-bold">{isFr ? "Des questions ?" : "Questions?"}</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {isFr ? "Contactez notre délégué à la protection des données." : "Contact our data protection officer."}
          </p>
          <a href="mailto:privacy@yowspare.com" className="mt-4 inline-block rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
            privacy@yowspare.com
          </a>
        </div>
      </div>
    </div>
  );
}
