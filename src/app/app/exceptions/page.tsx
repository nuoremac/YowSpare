"use client";

import { useState } from "react";
import {
  ExceptionTicket,
  ExceptionStatus,
  makeId,
  nowIso,
  readWorkflowState,
  updateWorkflowState,
} from "@/lib/workflowStore";
import { useSession } from "@/store/session";
import { hasAnyAuthority, hasFullOrganizationAccess } from "@/lib/accessControl";
import { useT } from "@/components/i18n/useT";
import type { TranslationKey } from "@/components/i18n/translation";

export default function ExceptionsPage() {
  const { t, lang } = useT();
  const { roles, tenant, user } = useSession();
  const canManageExceptions =
    hasFullOrganizationAccess({ authorities: roles, user, organization: tenant }) ||
    hasAnyAuthority(roles, ["inventory:write", "procurement:write"]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ExceptionTicket["type"]>("STOCKOUT");
  const [severity, setSeverity] = useState<ExceptionTicket["severity"]>("MEDIUM");
  const [statusFilter, setStatusFilter] = useState<ExceptionStatus | "ALL">("OPEN");
  const [, setReloadKey] = useState(0);
  const [toast, setToast] = useState<{ tone: "ok" | "err"; message: string } | null>(null);

  const tickets = readWorkflowState().exceptions;
  const list = tickets.filter((it) => (statusFilter === "ALL" ? true : it.status === statusFilter));
  const stats = {
    open: tickets.filter((ticket) => ticket.status === "OPEN").length,
    critical: tickets.filter((ticket) => ticket.status === "OPEN" && ticket.severity === "CRITICAL").length,
    resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
  };

  const createTicket = () => {
    if (!canManageExceptions) return;
    if (!title.trim() || !description.trim()) {
      setToast({ tone: "err", message: t("app.exceptions.error.required") });
      return;
    }
    const at = nowIso();
    const ticket: ExceptionTicket = {
      id: makeId(),
      title: title.trim(),
      description: description.trim(),
      type,
      severity,
      status: "OPEN",
      createdAt: at,
      updatedAt: at,
    };
    updateWorkflowState((current) => ({
      ...current,
      exceptions: [ticket, ...current.exceptions],
    }));
    setTitle("");
    setDescription("");
    setType("STOCKOUT");
    setSeverity("MEDIUM");
    setReloadKey((n) => n + 1);
    setToast({ tone: "ok", message: t("app.exceptions.success.created") });
    window.setTimeout(() => setToast(null), 2200);
  };

  const setStatus = (id: string, status: ExceptionStatus) => {
    if (!canManageExceptions) return;
    const at = nowIso();
    updateWorkflowState((current) => ({
      ...current,
      exceptions: current.exceptions.map((it) => (it.id === id ? { ...it, status, updatedAt: at } : it)),
    }));
    setReloadKey((n) => n + 1);
  };

  return (
    <main className="ys-page">
      <section className="ys-page-header">
        <h2 className="ys-page-title">{t("app.exceptions.title")}</h2>
        <p className="ys-page-subtitle">{t("app.exceptions.subtitle")}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: t("app.exceptions.kpi.open"), value: stats.open },
            { label: t("app.exceptions.kpi.critical"), value: stats.critical },
            { label: t("app.exceptions.kpi.resolved"), value: stats.resolved },
          ].map((item) => (
            <div key={item.label} className="ys-card px-4 py-3">
              <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {toast ? (
        <section className={toast.tone === "ok" ? "ys-alert-success" : "ys-alert-error"}>{toast.message}</section>
      ) : null}

      <section className="ys-card p-5">
        <div className="ys-section-title">{t("app.exceptions.form.title")}</div>
        <p className="mt-1 text-sm text-muted-foreground">{t("app.exceptions.form.subtitle")}</p>
        <div className="ys-filter-grid mt-4 md:grid-cols-3">
          <label className="ys-filter-label md:col-span-2">
            {t("app.exceptions.form.name")}
            <input
              className="ys-filter-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("app.exceptions.form.namePlaceholder")}
            />
          </label>
          <label className="ys-filter-label">
            {t("app.exceptions.form.type")}
            <select className="ys-filter-control" value={type} onChange={(e) => setType(e.target.value as ExceptionTicket["type"])}>
              {(["STOCKOUT", "SUBSTITUTION", "SUPPLIER_DELAY", "QUALITY", "OTHER"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`app.workflow.exceptionType.${value}` as TranslationKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="ys-filter-label">
            {t("app.exceptions.form.severity")}
            <select
              className="ys-filter-control"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as ExceptionTicket["severity"])}
            >
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`app.workflow.severity.${value}` as TranslationKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="ys-filter-label md:col-span-3">
            {t("app.exceptions.form.description")}
            <textarea
              className="ys-input mt-1 min-h-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("app.exceptions.form.descriptionPlaceholder")}
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {canManageExceptions ? t("app.exceptions.form.trackingHint") : t("app.exceptions.form.readOnly")}
          </div>
          <button type="button" className="ys-btn-primary" onClick={createTicket} disabled={!canManageExceptions}>
            {t("app.exceptions.form.submit")}
          </button>
        </div>
      </section>

      <section className="ys-card p-5">
        <div className="ys-toolbar">
          <div>
            <div className="ys-section-title">{t("app.exceptions.list.title")}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t("app.exceptions.list.subtitle")}</p>
          </div>
          <select
            className="ys-filter-control w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExceptionStatus | "ALL")}
          >
            <option value="ALL">{t("app.exceptions.list.filterAll")}</option>
            <option value="OPEN">{t("app.workflow.status.OPEN")}</option>
            <option value="RESOLVED">{t("app.workflow.status.RESOLVED")}</option>
          </select>
        </div>
        {!list.length ? (
          <div className="mt-4 text-sm text-muted-foreground">{t("app.exceptions.list.empty")}</div>
        ) : (
          <div className="mt-4 space-y-2">
            {list.map((it) => (
              <div key={it.id} className="rounded-md border border-border px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{it.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t(`app.workflow.exceptionType.${it.type}` as TranslationKey)} -{" "}
                      {t(`app.workflow.severity.${it.severity}` as TranslationKey)} -{" "}
                      {t(`app.workflow.status.${it.status}` as TranslationKey)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t("app.exceptions.updated")}{" "}
                      {new Date(it.updatedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {it.status !== "RESOLVED" ? (
                      <button type="button" className="ys-btn-primary text-xs" onClick={() => setStatus(it.id, "RESOLVED")} disabled={!canManageExceptions}>
                        {t("app.exceptions.action.resolve")}
                      </button>
                    ) : (
                      <button type="button" className="ys-btn-secondary text-xs" onClick={() => setStatus(it.id, "OPEN")} disabled={!canManageExceptions}>
                        {t("app.exceptions.action.reopen")}
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{it.description}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
