"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/useT";

export default function SecurityPage() {
  const { lang } = useT();
  const isFr = lang === "fr";

  const pillars = [
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      title: isFr ? "Chiffrement de Bout en Bout" : "End-to-End Encryption",
      body: isFr
        ? "Toutes vos données de stock, utilisateurs et mouvements sont chiffrées au repos avec AES-256 et en transit avec TLS 1.3. Même nos équipes n'ont pas accès à vos données en clair."
        : "All your inventory, user, and movement data is encrypted at rest with AES-256 and in transit with TLS 1.3. Even our own teams cannot access your data in plaintext.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/>
        </svg>
      ),
      color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
      title: isFr ? "Contrôle d'Accès Granulaire (RBAC)" : "Granular Access Control (RBAC)",
      body: isFr
        ? "Notre système de gestion des rôles (RBAC multi-tenant) vous permet de définir précisément qui peut consulter, modifier, approuver ou auditer chaque ressource. Isolation totale entre organisations."
        : "Our multi-tenant RBAC system lets you define precisely who can view, edit, approve, or audit each resource. Total isolation between organizations.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      title: isFr ? "Haute Disponibilité (99.9% Uptime)" : "High Availability (99.9% Uptime)",
      body: isFr
        ? "YowSpare est hébergé sur une infrastructure redondante multi-régions. Des sauvegardes automatiques sont effectuées chaque heure. En cas d'incident, le basculement est automatique en moins de 30 secondes."
        : "YowSpare is hosted on multi-region redundant infrastructure. Automatic backups run every hour. In case of an incident, failover is automatic in under 30 seconds.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round"/>
        </svg>
      ),
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      title: isFr ? "Piste d'Audit Complète" : "Complete Audit Trail",
      body: isFr
        ? "Chaque action (création, modification, suppression, consultation) est horodatée et attribuée à un utilisateur identifié. L'historique est immuable, exportable, et conservé 7 ans par défaut."
        : "Every action (create, modify, delete, view) is timestamped and attributed to an identified user. The log is immutable, exportable, and retained for 7 years by default.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
      title: isFr ? "Isolation Multi-Tenant" : "Multi-Tenant Isolation",
      body: isFr
        ? "Chaque organisation est isolée au niveau de la base de données par un identifiant de tenant unique. Il est architecturalement impossible pour une organisation d'accéder aux données d'une autre."
        : "Each organization is isolated at the database level by a unique tenant identifier. It is architecturally impossible for one organization to access another's data.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4l3 3" strokeLinecap="round"/>
        </svg>
      ),
      color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
      title: isFr ? "Tokens JWT à Courte Durée de Vie" : "Short-Lived JWT Tokens",
      body: isFr
        ? "L'authentification repose sur des tokens JWT signés avec rotation automatique. Les sessions expirées ne peuvent pas être réutilisées. Aucune donnée sensible n'est stockée côté client."
        : "Authentication relies on signed JWTs with automatic rotation. Expired sessions cannot be reused. No sensitive data is stored client-side.",
    },
  ];

  return (
    <div className="w-full text-slate-900 dark:text-slate-100">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-28 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(59,130,246,0.5) 0%, transparent 60%), radial-gradient(circle at 70% 20%, rgba(6,182,212,0.4) 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            {isFr ? "Vos données, protégées par design" : "Your data, protected by design"}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-blue-100">
            {isFr
              ? "La sécurité n'est pas une option — c'est notre fondation architecturale. Chaque décision de conception part du principe que vos données de stock sont sensibles."
              : "Security is not a feature — it's our architectural foundation. Every design decision starts from the principle that your inventory data is sensitive."}
          </p>
        </div>
      </section>

      {/* Pillars Grid */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-900"
            >
              <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${p.color}`}>
                {p.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance banner */}
      <section className="border-t border-slate-200 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">
            {isFr ? "Conformité & Standards" : "Compliance & Standards"}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            {isFr
              ? "YowSpare est conçu pour répondre aux exigences réglementaires des industries manufacturières, pétrolières, et de maintenance."
              : "YowSpare is designed to meet the regulatory requirements of manufacturing, oil & gas, and maintenance industries."}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {["ISO 27001", "SOC 2 Type II", "GDPR Ready", "OHADA Compliant"].map((badge) => (
              <div key={badge} className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {badge}
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Link href="/contact" className="inline-block rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-md transition hover:bg-blue-700">
              {isFr ? "Demander un rapport de sécurité" : "Request a security report"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
