"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AgenciesService } from "@/lib";
import type { Agency } from "@/lib";
import { useT } from "@/components/i18n/useT";
import { setTheme } from "@/lib/theme";

type ThemeMode = "light" | "dark" | "system";
type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
type NumberFormat = "fr-FR" | "en-US";
type CurrencyCode = "XAF" | "EUR" | "USD";
type TableDensity = "compact" | "comfortable";

type UserSettings = {
 interfaceLanguage: "fr" | "en";
 theme: ThemeMode;
 timezone: string;
 dateFormat: DateFormat;
 numberFormat: NumberFormat;
 currency: CurrencyCode;
 defaultAgencyId: string;
 tableDensity: TableDensity;
 pageSize: number;
 compactView: boolean;
 notificationsEmail: boolean;
 notificationsInApp: boolean;
 notificationTypes: string[];
 keyboardShortcutsEnabled: boolean;
 accessibilityReduceMotion: boolean;
 accessibilityHighContrast: boolean;
};

type SettingsLogItem = {
 id: string;
 when: string;
 action: string;
 payload: Record<string, unknown>;
};

const SETTINGS_STORAGE_KEY = "yowspare-user-settings-v1";
const SETTINGS_LOG_STORAGE_KEY = "yowspare-user-settings-log-v1";

function defaultSettings(lang: "fr" | "en"): UserSettings {
 return {
 interfaceLanguage: lang,
 theme: "system",
 timezone: "Africa/Douala",
 dateFormat: "DD/MM/YYYY",
 numberFormat: "fr-FR",
 currency: "XAF",
 defaultAgencyId: "",
 tableDensity: "comfortable",
 pageSize: 25,
 compactView: false,
 notificationsEmail: true,
 notificationsInApp: true,
 notificationTypes: ["low_stock", "movements", "approvals"],
 keyboardShortcutsEnabled: true,
 accessibilityReduceMotion: false,
 accessibilityHighContrast: false,
 };
}

function readSettings(lang: "fr" | "en"): UserSettings {
 if (typeof window === "undefined") return defaultSettings(lang);
 const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
 if (!raw) return defaultSettings(lang);
 try {
 const parsed = JSON.parse(raw) as Partial<UserSettings>;
 return { ...defaultSettings(lang), ...parsed };
 } catch {
 return defaultSettings(lang);
 }
}

function readLogs(): SettingsLogItem[] {
 if (typeof window === "undefined") return [];
 const raw = window.localStorage.getItem(SETTINGS_LOG_STORAGE_KEY);
 if (!raw) return [];
 try {
 const parsed = JSON.parse(raw) as SettingsLogItem[];
 return Array.isArray(parsed) ? parsed : [];
 } catch {
 return [];
 }
}

function appendLog(action: string, payload: Record<string, unknown>) {
 if (typeof window === "undefined") return;
 const next: SettingsLogItem = {
 id: crypto.randomUUID(),
 when: new Date().toISOString(),
 action,
 payload,
 };
 const logs = [next, ...readLogs()].slice(0, 300);
 window.localStorage.setItem(SETTINGS_LOG_STORAGE_KEY, JSON.stringify(logs));
}

function downloadJsonFile(filename: string, payload: unknown) {
 if (typeof window === "undefined") return;
 const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
 const url = URL.createObjectURL(blob);
 const anchor = document.createElement("a");
 anchor.href = url;
 anchor.download = filename;
 document.body.appendChild(anchor);
 anchor.click();
 document.body.removeChild(anchor);
 URL.revokeObjectURL(url);
}

export default function SettingsPage() {
 const { t, lang, setLang } = useT();
 const fr = lang === "fr";
 const [settings, setSettings] = useState<UserSettings>(() => readSettings(lang));
 const [agencies, setAgencies] = useState<Agency[]>([]);
 const [savedAt, setSavedAt] = useState<string>("");

 const timezoneOptions = useMemo(() => {
 const current = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
 return Array.from(
 new Set([current, "Africa/Douala", "Africa/Abidjan", "Africa/Lagos", "Europe/Paris", "Europe/London", "UTC"])
 );
 }, []);

 useEffect(() => {
 let mounted = true;
 (async () => {
 try {
 const list = await AgenciesService.getAgencies();
 if (!mounted) return;
 setAgencies(list || []);
 } catch {
 if (!mounted) return;
 setAgencies([]);
 }
 })();
 return () => {
 mounted = false;
 };
 }, []);

 useEffect(() => {
 if (typeof window === "undefined") return;
 window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
 setSavedAt(new Date().toISOString());
 }, [settings]);

 useEffect(() => {
 if (settings.interfaceLanguage !== lang) {
 setLang(settings.interfaceLanguage);
 }
 }, [lang, setLang, settings.interfaceLanguage]);

 useEffect(() => {
 if (typeof window === "undefined") return;
 if (settings.theme === "system") {
 const media = window.matchMedia("(prefers-color-scheme: dark)");
 const sync = () => {
 const resolved = media.matches ? "dark" : "light";
 setTheme(resolved);
 };
 sync();
 media.addEventListener("change", sync);
 return () => media.removeEventListener("change", sync);
 }

 setTheme(settings.theme);
 }, [settings.theme]);

 const label = {
 interface: fr ? "Interface utilisateur" : "User interface",
 locale: fr ? "Localisation et formats" : "Localization and formats",
 display: fr ? "Preferences d'affichage" : "Display preferences",
 startup: fr ? "Ouverture et contexte" : "Startup and context",
 notifications: fr ? "Notifications" : "Notifications",
 security: fr ? "Securite de session" : "Session security",
 keyboard: fr ? "Raccourcis et accessibilite" : "Shortcuts and accessibility",
 export: fr ? "Export personnel" : "Personal export",
 support: fr ? "Aide et support" : "Help and support",
 saved: fr ? "Derniere sauvegarde" : "Last saved",
 };

 const inputClass = "mt-1 ys-input";
 const cardClass = "ys-card p-4";

 const patchSettings = (patch: Partial<UserSettings>, action: string) => {
 setSettings((prev) => ({ ...prev, ...patch }));
 appendLog(action, patch as Record<string, unknown>);
 };

 const toggleNotificationType = (kind: string) => {
 const has = settings.notificationTypes.includes(kind);
 const next = has
 ? settings.notificationTypes.filter((s) => s !== kind)
 : [...settings.notificationTypes, kind];
 patchSettings({ notificationTypes: next }, "notification_type_toggled");
 };

 const exportPreferences = () => {
 downloadJsonFile("yowspare-preferences.json", {
 exportedAt: new Date().toISOString(),
 settings,
 });
 };

 const exportLogs = () => {
 downloadJsonFile("yowspare-settings-log.json", {
 exportedAt: new Date().toISOString(),
 logs: readLogs(),
 });
 };

 return (
 <main className="ys-page">
 <section className="ys-page-header">
 <h2 className="ys-page-title">{t("app.settings.title")}</h2>
 <p className="ys-page-subtitle">{t("app.settings.subtitle")}</p>
 {savedAt ? (
 <p className="mt-2 text-xs text-muted-foreground">
 {label.saved}: {new Date(savedAt).toLocaleString()}
 </p>
 ) : null}
 </section>

 <section className="grid gap-4 xl:grid-cols-2">
 <div className={cardClass}>
 <h3 className="ys-section-title">{label.interface}</h3>
 <div className="mt-3 grid gap-3">
 <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 {fr ? "Langue de l'interface" : "Interface language"}
 <select
 className={inputClass}
 value={settings.interfaceLanguage}
 onChange={(e) =>
 patchSettings({ interfaceLanguage: e.target.value as "fr" | "en" }, "language_changed")
 }
 >
 <option value="fr">Francais</option>
 <option value="en">English</option>
 </select>
 </label>

 <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 {fr ? "Theme" : "Theme"}
 <select
 className={inputClass}
 value={settings.theme}
 onChange={(e) => patchSettings({ theme: e.target.value as ThemeMode }, "theme_changed")}
 >
 <option value="system">{fr ? "Systeme" : "System"}</option>
 <option value="light">{fr ? "Clair" : "Light"}</option>
 <option value="dark">{fr ? "Sombre" : "Dark"}</option>
 </select>
 </label>
 </div>
 </div>

 <div className={cardClass}>
 <h3 className="ys-section-title">{label.locale}</h3>
 <div className="mt-3 grid gap-3">
 <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 {fr ? "Fuseau horaire" : "Timezone"}
 <select
 className={inputClass}
 value={settings.timezone}
 onChange={(e) => patchSettings({ timezone: e.target.value }, "timezone_changed")}
 >
 {timezoneOptions.map((tz) => (
 <option key={tz} value={tz}>
 {tz}
 </option>
 ))}
 </select>
 </label>

 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 {fr ? "Format date/heure" : "Date/time format"}
 <select
 className={inputClass}
 value={settings.dateFormat}
 onChange={(e) => patchSettings({ dateFormat: e.target.value as DateFormat }, "date_format_changed")}
 >
 <option value="DD/MM/YYYY">DD/MM/YYYY</option>
 <option value="MM/DD/YYYY">MM/DD/YYYY</option>
 <option value="YYYY-MM-DD">YYYY-MM-DD</option>
 </select>
 </label>

 <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 {fr ? "Format nombre/devise" : "Number/currency format"}
 <select
 className={inputClass}
 value={`${settings.numberFormat}|${settings.currency}`}
 onChange={(e) => {
 const [numberFormat, currency] = e.target.value.split("|");
 patchSettings(
 {
 numberFormat: numberFormat as NumberFormat,
 currency: currency as CurrencyCode,
 },
 "number_currency_changed"
 );
 }}
 >
 <option value="fr-FR|XAF">fr-FR / XAF</option>
 <option value="fr-FR|EUR">fr-FR / EUR</option>
 <option value="en-US|USD">en-US / USD</option>
 </select>
 </label>
 </div>
 </div>
 </div>

 <div className={cardClass}>
 <h3 className="ys-section-title">{label.startup}</h3>
 <div className="mt-3 grid gap-3">
 <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 {fr ? "Agence par defaut a l'ouverture" : "Default agency at startup"}
 <select
 className={inputClass}
 value={settings.defaultAgencyId}
 onChange={(e) => patchSettings({ defaultAgencyId: e.target.value }, "default_agency_changed")}
 >
 <option value="">{fr ? "Selection automatique" : "Automatic selection"}</option>
 {agencies.map((agency) => (
 <option key={agency.id} value={agency.id}>
 {agency.name || agency.code || agency.id}
 </option>
 ))}
 </select>
 </label>
 </div>
 </div>

 <div className={cardClass}>
 <h3 className="ys-section-title">{label.display}</h3>
 <div className="mt-3 grid gap-3">
 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 {fr ? "Densite des tableaux" : "Table density"}
 <select
 className={inputClass}
 value={settings.tableDensity}
 onChange={(e) =>
 patchSettings({ tableDensity: e.target.value as TableDensity }, "table_density_changed")
 }
 >
 <option value="comfortable">{fr ? "Confortable" : "Comfortable"}</option>
 <option value="compact">{fr ? "Compacte" : "Compact"}</option>
 </select>
 </label>

 <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 {fr ? "Taille de page" : "Page size"}
 <select
 className={inputClass}
 value={settings.pageSize}
 onChange={(e) => patchSettings({ pageSize: Number(e.target.value) }, "page_size_changed")}
 >
 <option value={10}>10</option>
 <option value={25}>25</option>
 <option value={50}>50</option>
 <option value={100}>100</option>
 </select>
 </label>
 </div>

 <label className="inline-flex items-center gap-2 text-sm text-foreground">
 <input
 type="checkbox"
 className="h-4 w-4 accent-[var(--brand)]"
 checked={settings.compactView}
 onChange={(e) => patchSettings({ compactView: e.target.checked }, "compact_view_toggled")}
 />
 {fr ? "Vue compacte" : "Compact view"}
 </label>
 </div>
 </div>

 <div className={cardClass}>
 <h3 className="ys-section-title">{label.notifications}</h3>
 <div className="mt-3 space-y-2">
 <label className="inline-flex items-center gap-2 text-sm text-foreground">
 <input
 type="checkbox"
 className="h-4 w-4 accent-[var(--brand)]"
 checked={settings.notificationsEmail}
 onChange={(e) =>
 patchSettings({ notificationsEmail: e.target.checked }, "notifications_email_toggled")
 }
 />
 {fr ? "Notifications email" : "Email notifications"}
 </label>
 <label className="inline-flex items-center gap-2 text-sm text-foreground">
 <input
 type="checkbox"
 className="h-4 w-4 accent-[var(--brand)]"
 checked={settings.notificationsInApp}
 onChange={(e) =>
 patchSettings({ notificationsInApp: e.target.checked }, "notifications_in_app_toggled")
 }
 />
 {fr ? "Notifications in-app" : "In-app notifications"}
 </label>

 <div className="pt-1">
 <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 {fr ? "Types d'alertes" : "Alert types"}
 </p>
 <div className="mt-2 grid gap-2 md:grid-cols-2">
 {[
 { key: "low_stock", label: fr ? "Stock bas" : "Low stock" },
 { key: "movements", label: fr ? "Mouvements de stock" : "Stock movements" },
 { key: "approvals", label: fr ? "Demandes a valider" : "Approval requests" },
 { key: "security", label: fr ? "Securite connexion" : "Security events" },
 ].map((item) => (
 <label key={item.key} className="inline-flex items-center gap-2 text-sm text-foreground">
 <input
 type="checkbox"
 className="h-4 w-4 accent-[var(--brand)]"
 checked={settings.notificationTypes.includes(item.key)}
 onChange={() => toggleNotificationType(item.key)}
 />
 {item.label}
 </label>
 ))}
 </div>
 </div>
 </div>
 </div>

 <div className={cardClass}>
 <h3 className="ys-section-title">{label.security}</h3>
 <div className="mt-3 space-y-3">
 <div className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm">
 <p className="font-semibold text-foreground">{fr ? "Session active" : "Active session"}</p>
 <p className="text-xs text-muted-foreground">
 {fr ? "Navigateur actuel - session locale" : "Current browser - local session"}
 </p>
 </div>
 <button
 type="button"
 disabled
 className="ys-btn-secondary w-full justify-center opacity-70"
 title={fr ? "Necessite un endpoint backend de revocation globale" : "Requires backend global revoke endpoint"}
 >
 {fr ? "Deconnecter tous les appareils (bientot)" : "Sign out all devices (coming soon)"}
 </button>
 </div>
 </div>

 <div className={cardClass}>
 <h3 className="ys-section-title">{label.keyboard}</h3>
 <div className="mt-3 space-y-2">
 {[
 {
 key: "keyboardShortcutsEnabled",
 text: fr ? "Raccourcis clavier actifs" : "Enable keyboard shortcuts",
 action: "keyboard_shortcuts_toggled",
 },
 {
 key: "accessibilityReduceMotion",
 text: fr ? "Reduire les animations" : "Reduce motion",
 action: "reduce_motion_toggled",
 },
 {
 key: "accessibilityHighContrast",
 text: fr ? "Contraste eleve" : "High contrast mode",
 action: "high_contrast_toggled",
 },
 ].map((item) => {
 const value = settings[item.key as keyof UserSettings] as boolean;
 return (
 <label key={item.key} className="inline-flex items-center gap-2 text-sm text-foreground">
 <input
 type="checkbox"
 className="h-4 w-4 accent-[var(--brand)]"
 checked={value}
 onChange={(e) =>
 patchSettings(
 { [item.key]: e.target.checked } as Partial<UserSettings>,
 item.action
 )
 }
 />
 {item.text}
 </label>
 );
 })}
 </div>
 </div>

 <div className={cardClass}>
 <h3 className="ys-section-title">{label.export}</h3>
 <div className="mt-3 grid gap-2">
 <button
 type="button"
 onClick={exportPreferences}
 className="ys-btn-secondary justify-start"
 >
 {fr ? "Exporter mes preferences (JSON)" : "Export my preferences (JSON)"}
 </button>
 <button
 type="button"
 onClick={exportLogs}
 className="ys-btn-secondary justify-start"
 >
 {fr ? "Exporter mes logs personnels (JSON)" : "Export my personal logs (JSON)"}
 </button>
 </div>
 </div>

 <div className={cardClass}>
 <h3 className="ys-section-title">{label.support}</h3>
 <div className="mt-3 flex flex-col gap-2 text-sm">
 <Link href="/help" className="text-primary hover:underline">
 {fr ? "Centre d'aide / documentation" : "Help center / documentation"}
 </Link>
 <Link href="/contact" className="text-primary hover:underline">
 {fr ? "Contacter le support" : "Contact support"}
 </Link>
 <a href="mailto:support@yowspare.com" className="text-primary hover:underline">
 support@yowspare.com
 </a>
 </div>
 </div>
 </section>
 </main>
 );
}
