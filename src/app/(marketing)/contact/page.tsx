"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/useT";

export default function ContactPage() {
  const { lang } = useT();
  const isFr = lang === "fr";
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const channels = [
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round"/>
        </svg>
      ),
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      title: "Email",
      value: "contact@yowspare.com",
      sub: isFr ? "Réponse sous 24h ouvrées" : "Response within 24 business hours",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round"/>
        </svg>
      ),
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      title: isFr ? "Téléphone" : "Phone",
      value: "+237 690 000 000",
      sub: isFr ? "Lun-Ven, 8h–18h (WAT)" : "Mon-Fri, 8am–6pm (WAT)",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round"/>
          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round"/>
        </svg>
      ),
      color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
      title: isFr ? "Adresse" : "Address",
      value: "Yaoundé, Cameroun",
      sub: isFr ? "Siège social — Mfoundi" : "Headquarters — Mfoundi",
    },
  ];

  const subjects = isFr
    ? ["Demande commerciale", "Support technique", "Partenariat", "Presse / Médias", "Autre"]
    : ["Sales inquiry", "Technical support", "Partnership", "Press / Media", "Other"];

  return (
    <div className="w-full text-slate-900 dark:text-slate-100">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          {isFr ? "Parlons de votre projet" : "Let's talk about your project"}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-600 dark:text-slate-400">
          {isFr
            ? "Que vous soyez une PME, un groupe industriel, ou un partenaire potentiel, notre équipe est à votre écoute."
            : "Whether you're a small business, an industrial group, or a potential partner, our team is listening."}
        </p>
      </section>

      {/* Contact channels */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {channels.map((c) => (
            <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${c.color}`}>{c.icon}</div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">{c.title}</h3>
              <p className="mt-1 font-medium text-blue-600 dark:text-blue-400">{c.value}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{c.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="border-t border-slate-200 bg-slate-50 py-24 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-center">
            {isFr ? "Envoyer un message" : "Send a message"}
          </h2>
          <p className="mt-3 text-center text-slate-600 dark:text-slate-400">
            {isFr ? "Nous vous répondons généralement en moins de 24h ouvrées." : "We typically respond in less than 24 business hours."}
          </p>

          {submitted ? (
            <div className="mt-10 rounded-3xl border border-emerald-200 bg-emerald-50 p-12 text-center dark:border-emerald-900/50 dark:bg-emerald-900/10">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">OK</div>
              <h3 className="mt-4 text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                {isFr ? "Message envoyé !" : "Message sent!"}
              </h3>
              <p className="mt-2 text-emerald-700 dark:text-emerald-400">
                {isFr ? "Nous vous contacterons dès que possible." : "We'll get back to you as soon as possible."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{isFr ? "Nom complet" : "Full name"} *</label>
                  <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jean Dupont" className="mt-2 w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{isFr ? "Email professionnel" : "Work email"} *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jean@entreprise.cm" className="mt-2 w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{isFr ? "Entreprise" : "Company"}</label>
                <input type="text" value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder={isFr ? "Entreprise Maintenance SA" : "Maintenance Company Ltd"} className="mt-2 w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{isFr ? "Sujet" : "Subject"} *</label>
                <select required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950">
                  <option value="">{isFr ? "Sélectionner un sujet" : "Select a subject"}</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{isFr ? "Message" : "Message"} *</label>
                <textarea required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder={isFr ? "Décrivez votre besoin en détail..." : "Describe your need in detail..."} className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-md transition hover:bg-blue-700">
                {isFr ? "Envoyer le message" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
