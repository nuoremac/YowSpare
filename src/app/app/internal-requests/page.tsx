"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AgenciesService } from "@/lib";
import { setAgencyId as setApiAgencyId } from "@/lib/api";
import type { Agency } from "@/lib";
import { ProductCatalogService } from "@/lib-stock";
import type { Product } from "@/lib-stock";
import {
  MaterialOperationsControllerService,
  type DepartmentDto,
  type MaterialRequestDto,
} from "@/lib-spare";
import { useSession } from "@/store/session";
import { hasAuthority, hasFullOrganizationAccess } from "@/lib/accessControl";
import { useT } from "@/components/i18n/useT";
import type { TranslationKey } from "@/components/i18n/translation";

type FormState = {
  agencyId: string;
  departmentId: string;
  productId: string;
  quantity: number;
  reason: string;
  neededFrom: string;
  neededTo: string;
};

const INITIAL_FORM: FormState = {
  agencyId: "",
  departmentId: "",
  productId: "",
  quantity: 1,
  reason: "",
  neededFrom: "",
  neededTo: "",
};

export default function InternalRequestsPage() {
  const { t, lang } = useT();
  const { roles, tenant, user, activeAgencyId, setActiveAgencyId } = useSession();
  const canCreateRequest =
    hasFullOrganizationAccess({ authorities: roles, user, organization: tenant }) ||
    hasAuthority(roles, "resources:read");
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<MaterialRequestDto[]>([]);
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM, agencyId: activeAgencyId || "" });
  const [toast, setToast] = useState("");

  const loadRequests = useCallback(async (agencyId?: string) => {
    const rows = await MaterialOperationsControllerService.listMaterialRequests(agencyId || undefined);
    setRequests(rows || []);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [agenciesRes, productsRes, requestsRes] = await Promise.allSettled([
        AgenciesService.getAgencies(),
        ProductCatalogService.getProducts(),
        MaterialOperationsControllerService.listMaterialRequests(activeAgencyId || undefined),
      ]);
      if (!mounted) return;
      const nextAgencies = agenciesRes.status === "fulfilled" ? agenciesRes.value || [] : [];
      const nextAgencyId = activeAgencyId || nextAgencies[0]?.id || "";
      setAgencies(nextAgencies);
      setProducts(productsRes.status === "fulfilled" ? productsRes.value || [] : []);
      setRequests(requestsRes.status === "fulfilled" ? requestsRes.value || [] : []);
      setForm((prev) => ({ ...prev, agencyId: prev.agencyId || nextAgencyId }));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [activeAgencyId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!form.agencyId) {
        setDepartments([]);
        return;
      }
      const rows = await MaterialOperationsControllerService.listDepartments(form.agencyId, true).catch(() => []);
      if (!mounted) return;
      setDepartments(rows || []);
      setForm((prev) => {
        if (!prev.departmentId || rows.some((department) => department.id === prev.departmentId)) return prev;
        return { ...prev, departmentId: "" };
      });
    })();
    return () => {
      mounted = false;
    };
  }, [form.agencyId]);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      if (p.id) map.set(p.id, p);
    });
    return map;
  }, [products]);

  const departmentById = useMemo(() => {
    const map = new Map<string, DepartmentDto>();
    departments.forEach((department) => {
      if (department.id) map.set(department.id, department);
    });
    return map;
  }, [departments]);

  const requestLine = (request: MaterialRequestDto) => request.items?.[0] || null;

  const requestProductLabel = (request: MaterialRequestDto) => {
    const line = requestLine(request);
    const product = line?.productId ? productById.get(line.productId) : null;
    return product?.name || product?.sku || line?.productId || "-";
  };

  const requestQuantity = (request: MaterialRequestDto) =>
    (request.items || []).reduce((sum, item) => sum + Number(item.quantityRequested || 0), 0);

  const requestDepartmentLabel = (request: MaterialRequestDto) => {
    const department = request.departmentId ? departmentById.get(request.departmentId) : null;
    return department?.name || department?.code || request.departmentId || "-";
  };

  const requestStats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((request) => (request.status || "").toUpperCase() === "PENDING").length,
      approved: requests.filter((request) => (request.status || "").toUpperCase() === "APPROVED").length,
    }),
    [requests],
  );

  const createRequest = async () => {
    if (!canCreateRequest) return;
    if (!form.agencyId || !form.departmentId || !form.productId || !form.reason.trim()) {
      setToast(t("app.internalRequests.error.required"));
      return;
    }

    try {
      if (form.agencyId !== activeAgencyId) {
        setActiveAgencyId(form.agencyId);
        setApiAgencyId(form.agencyId);
      }
      const created = await MaterialOperationsControllerService.createMaterialRequest({
        departmentId: form.departmentId,
        reasonText: form.reason.trim(),
        expectedReturnAt: form.neededTo ? new Date(`${form.neededTo}T23:59:59`).toISOString() : undefined,
        items: [
          {
            productId: form.productId,
            quantity: Math.max(1, Number(form.quantity || 1)),
            note: form.neededFrom ? `${t("app.internalRequests.form.neededFrom")}: ${form.neededFrom}` : undefined,
          },
        ],
      });
      setRequests((prev) => [created, ...prev.filter((request) => request.id !== created.id)]);
      setForm((prev) => ({ ...INITIAL_FORM, agencyId: prev.agencyId }));
      setToast(t("app.internalRequests.success.created"));
      void loadRequests(form.agencyId);
      window.setTimeout(() => setToast(""), 2200);
    } catch {
      setToast(t("app.internalRequests.error.create"));
    }
  };

  return (
    <main className="ys-page">
      <section className="ys-page-header">
        <h2 className="ys-page-title">{t("app.internalRequests.title")}</h2>
        <p className="ys-page-subtitle">{t("app.internalRequests.subtitle")}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: t("app.internalRequests.kpi.total"), value: requestStats.total },
            { label: t("app.internalRequests.kpi.pending"), value: requestStats.pending },
            { label: t("app.internalRequests.kpi.approved"), value: requestStats.approved },
          ].map((item) => (
            <div key={item.label} className="ys-card px-4 py-3">
              <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="ys-card p-5">
        <div className="ys-section-title">{t("app.internalRequests.form.title")}</div>
        <p className="mt-1 text-sm text-muted-foreground">{t("app.internalRequests.form.subtitle")}</p>
        <div className="ys-filter-grid mt-4 md:grid-cols-2">
          <label className="ys-filter-label">
            {t("app.internalRequests.form.agency")}
            <select
              className="ys-filter-control"
              value={form.agencyId}
              onChange={(e) => setForm((prev) => ({ ...prev, agencyId: e.target.value }))}
            >
              <option value="">{t("app.internalRequests.form.select")}</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id || ""}>
                  {a.name || a.id}
                </option>
              ))}
            </select>
          </label>
          <label className="ys-filter-label">
            {t("app.internalRequests.form.department")}
            <select
              className="ys-filter-control"
              value={form.departmentId}
              onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value }))}
            >
              <option value="">{t("app.internalRequests.form.select")}</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id || ""}>
                  {department.name || department.code || department.id}
                </option>
              ))}
            </select>
          </label>
          <label className="ys-filter-label">
            {t("app.internalRequests.form.product")}
            <select
              className="ys-filter-control"
              value={form.productId}
              onChange={(e) => setForm((prev) => ({ ...prev, productId: e.target.value }))}
            >
              <option value="">{t("app.internalRequests.form.select")}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id || ""}>
                  {p.sku || p.name || p.id}
                </option>
              ))}
            </select>
          </label>
          <label className="ys-filter-label">
            {t("app.internalRequests.form.quantity")}
            <input
              type="number"
              min={1}
              className="ys-filter-control"
              value={form.quantity}
              onChange={(e) => setForm((prev) => ({ ...prev, quantity: Math.max(1, Number(e.target.value || 1)) }))}
            />
          </label>
          <label className="ys-filter-label">
            {t("app.internalRequests.form.neededFrom")}
            <input
              type="date"
              className="ys-filter-control"
              value={form.neededFrom}
              onChange={(e) => setForm((prev) => ({ ...prev, neededFrom: e.target.value }))}
            />
          </label>
          <label className="ys-filter-label">
            {t("app.internalRequests.form.neededTo")}
            <input
              type="date"
              className="ys-filter-control"
              value={form.neededTo}
              onChange={(e) => setForm((prev) => ({ ...prev, neededTo: e.target.value }))}
            />
          </label>
          <label className="ys-filter-label md:col-span-2">
            {t("app.internalRequests.form.reason")}
            <textarea
              className="ys-input mt-1 min-h-24"
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder={t("app.internalRequests.form.reasonPlaceholder")}
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {canCreateRequest
              ? t("app.internalRequests.form.approvalHint")
              : t("app.internalRequests.form.readOnly")}
          </div>
          <button type="button" onClick={createRequest} className="ys-btn-primary" disabled={!canCreateRequest}>
            {t("app.internalRequests.form.submit")}
          </button>
        </div>
        {toast ? <div className="mt-3 ys-alert-success">{toast}</div> : null}
      </section>

      <section className="ys-card p-5">
        <div className="ys-toolbar">
          <div>
            <div className="ys-section-title">{t("app.internalRequests.list.title")}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t("app.internalRequests.list.subtitle")}</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-muted-foreground">{t("app.internalRequests.list.loading")}</div>
        ) : !requests.length ? (
          <div className="mt-4 text-sm text-muted-foreground">{t("app.internalRequests.list.empty")}</div>
        ) : (
          <div className="ys-table-wrap mt-4">
            <table className="ys-table min-w-[840px]">
              <thead className="ys-table-head bg-muted/30">
                <tr>
                  <th className="ys-table-cell pl-4">{t("app.internalRequests.table.reference")}</th>
                  <th className="ys-table-cell">{t("app.internalRequests.table.department")}</th>
                  <th className="ys-table-cell">{t("app.internalRequests.table.part")}</th>
                  <th className="ys-table-cell">{t("app.internalRequests.table.quantity")}</th>
                  <th className="ys-table-cell">{t("app.internalRequests.table.status")}</th>
                  <th className="ys-table-cell">{t("app.internalRequests.table.created")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card text-foreground">
                {requests.map((req) => (
                  <tr key={req.id || `${req.departmentId}:${req.updatedAt}`} className="ys-table-row">
                    <td className="ys-table-cell pl-4 font-mono text-xs">
                      <Link href="/app/internal-requests" className="text-blue-700 hover:underline">
                        {(req.id || "-").slice(0, 8)}
                      </Link>
                    </td>
                    <td className="ys-table-cell">{requestDepartmentLabel(req)}</td>
                    <td className="ys-table-cell">{requestProductLabel(req)}</td>
                    <td className="ys-table-cell">{requestQuantity(req)}</td>
                    <td className="ys-table-cell">
                      {t(`app.workflow.status.${req.status || "PENDING"}` as TranslationKey)}
                    </td>
                    <td className="ys-table-cell">
                      {req.updatedAt
                        ? new Date(req.updatedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
