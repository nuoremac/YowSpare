"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/store/session";
import { getDB } from "@/lib/db";
import type { Agency, Tenant } from "@/lib/type";
import { uid } from "@/lib/utils";

type OrgFormState = {
  name: string;
  legalForm: string;
  email: string;
  websiteUrl: string;
  taxNumber: string;
  registrationNumber: string;
  ceoName: string;
  yearFounded: string;
  headquarterAgencyId: string;
};

type AgencyFormState = {
  name: string;
  location: string;
  contact: string;
  openTime: string;
  closeTime: string;
  description: string;
};

export default function AgencyPage() {
  const { tenant, user, role, activeAgencyId, setTenant } = useSession();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [orgForm, setOrgForm] = useState<OrgFormState>({
    name: "",
    legalForm: "",
    email: "",
    websiteUrl: "",
    taxNumber: "",
    registrationNumber: "",
    ceoName: "",
    yearFounded: "",
    headquarterAgencyId: "",
  });
  const [agencyForm, setAgencyForm] = useState<AgencyFormState>({
    name: "",
    location: "",
    contact: "",
    openTime: "",
    closeTime: "",
    description: "",
  });
  const [editingAgencyId, setEditingAgencyId] = useState<string | null>(null);

  const isOrgAdmin = role === "ORG_ADMIN";
  const isTenantAdmin = role === "TENANT_ADMIN";
  const canAccess = isOrgAdmin || isTenantAdmin;

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const db = await getDB();
      const items = await db.getAllFromIndex("agencies", "by_org", tenant.id);
      setAgencies(items);
    })();
  }, [tenant]);

  useEffect(() => {
    if (!tenant) return;
    setOrgForm({
      name: tenant.name || "",
      legalForm: tenant.profile?.legalForm || "",
      email: tenant.profile?.email || "",
      websiteUrl: tenant.profile?.websiteUrl || "",
      taxNumber: tenant.profile?.taxNumber || "",
      registrationNumber: tenant.profile?.registrationNumber || "",
      ceoName: tenant.profile?.ceoName || "",
      yearFounded: tenant.profile?.yearFounded ? String(tenant.profile.yearFounded) : "",
      headquarterAgencyId: tenant.profile?.headquarterAgencyId || "",
    });
  }, [tenant]);

  const visibleAgencies = useMemo(() => {
    if (isOrgAdmin) return agencies;
    if (activeAgencyId) return agencies.filter((a) => a.id === activeAgencyId);
    return agencies;
  }, [agencies, isOrgAdmin, activeAgencyId]);

  const headquarterAgency = useMemo(
    () => agencies.find((agency) => agency.id === orgForm.headquarterAgencyId),
    [agencies, orgForm.headquarterAgencyId]
  );


  async function saveAgency() {
    if (!tenant || !isOrgAdmin) return;
    const name = agencyForm.name.trim();
    if (!name) return;
    const db = await getDB();
    const agency: Agency = editingAgencyId
      ? {
          id: editingAgencyId,
          organizationId: tenant.id,
          name,
          location: agencyForm.location.trim() || undefined,
          contact: agencyForm.contact.trim() || undefined,
          openTime: agencyForm.openTime.trim() || undefined,
          closeTime: agencyForm.closeTime.trim() || undefined,
          description: agencyForm.description.trim() || undefined,
          ownerId: user?.id,
        }
      : {
          id: uid("a"),
          organizationId: tenant.id,
          name,
          location: agencyForm.location.trim() || undefined,
          contact: agencyForm.contact.trim() || undefined,
          openTime: agencyForm.openTime.trim() || undefined,
          closeTime: agencyForm.closeTime.trim() || undefined,
          description: agencyForm.description.trim() || undefined,
          ownerId: user?.id,
        };

    await db.put("agencies", agency);
    const items = await db.getAllFromIndex("agencies", "by_org", tenant.id);
    setAgencies(items);
    setAgencyForm({
      name: "",
      location: "",
      contact: "",
      openTime: "",
      closeTime: "",
      description: "",
    });
    setEditingAgencyId(null);
  }

  function startEditAgency(agency: Agency) {
    setEditingAgencyId(agency.id);
    setAgencyForm({
      name: agency.name,
      location: agency.location || "",
      contact: agency.contact || "",
      openTime: agency.openTime || "",
      closeTime: agency.closeTime || "",
      description: agency.description || "",
    });
  }

  async function deleteAgency(agencyId: string) {
    if (!tenant || !isOrgAdmin) return;
    const confirmed = window.confirm("Delete this agency?");
    if (!confirmed) return;
    const db = await getDB();
    await db.delete("agencies", agencyId);
    const items = await db.getAllFromIndex("agencies", "by_org", tenant.id);
    setAgencies(items);
    if (editingAgencyId === agencyId) {
      setEditingAgencyId(null);
      setAgencyForm({
        name: "",
        location: "",
        contact: "",
        openTime: "",
        closeTime: "",
        description: "",
      });
    }
  }

  if (!tenant) return <div className="text-sm text-gray-600 dark:text-slate-400">Loading…</div>;

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Agency</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          You don’t have access to this page in the mock demo.
        </p>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-[var(--brand)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 20V4h8v16M12 8h8v12" strokeLinecap="round" />
                <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" strokeLinecap="round" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold text-[var(--brand)]">Organization Profile</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            Keep legal and contact details for the organization.
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Headquarter: {headquarterAgency?.location || "—"}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Organization name</label>
            <input
              readOnly
              value={orgForm.name}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Legal form</label>
            <input
              readOnly
              value={orgForm.legalForm}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, legalForm: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Email</label>
            <input
              type="email"
              readOnly
              value={orgForm.email}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, email: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Website</label>
            <input
              readOnly
              value={orgForm.websiteUrl}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, websiteUrl: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Tax number</label>
            <input
              readOnly
              value={orgForm.taxNumber}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, taxNumber: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Registration number</label>
            <input
              readOnly
              value={orgForm.registrationNumber}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, registrationNumber: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium">CEO name</label>
            <input
              readOnly
              value={orgForm.ceoName}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, ceoName: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Year founded</label>
            <input
              type="date"
              readOnly
              value={orgForm.yearFounded}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, yearFounded: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Headquarter agency</label>
            <select
              disabled
              value={orgForm.headquarterAgencyId}
              onChange={(e) =>
                setOrgForm((prev) => ({ ...prev, headquarterAgencyId: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
            >
              <option value="">Select agency</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.location || agency.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Organization profile is read-only on this page.
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-100 text-orange-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 20V4h8v16M12 8h8v12" strokeLinecap="round" />
                  <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" strokeLinecap="round" />
                </svg>
              </span>
              <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">Agencies</h3>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              {isOrgAdmin
                ? "Create and manage agencies for the organization."
                : "Manage your agency details."}
            </p>
          </div>
        </div>

        {isOrgAdmin && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium">Agency name</label>
              <input
                value={agencyForm.name}
                onChange={(e) => setAgencyForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Location</label>
              <input
                value={agencyForm.location}
                onChange={(e) => setAgencyForm((prev) => ({ ...prev, location: e.target.value }))}
                list="agency-location-options"
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              />
              <datalist id="agency-location-options">
                {Array.from(
                  new Set(agencies.map((agency) => agency.location).filter(Boolean))
                ).map((location) => (
                  <option key={location} value={location as string} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-medium">Contact</label>
              <input
                value={agencyForm.contact}
                onChange={(e) => setAgencyForm((prev) => ({ ...prev, contact: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Open time</label>
              <input
                type="time"
                value={agencyForm.openTime}
                onChange={(e) => setAgencyForm((prev) => ({ ...prev, openTime: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Close time</label>
              <input
                type="time"
                value={agencyForm.closeTime}
                onChange={(e) => setAgencyForm((prev) => ({ ...prev, closeTime: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs font-medium">Description</label>
              <input
                value={agencyForm.description}
                onChange={(e) =>
                  setAgencyForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <div className="flex flex-wrap gap-2">
                {editingAgencyId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAgencyId(null);
                      setAgencyForm({
                        name: "",
                        location: "",
                        contact: "",
                        openTime: "",
                        closeTime: "",
                        description: "",
                      });
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={saveAgency}
                  className="rounded-xl border border-amber-200 bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 dark:border-amber-400 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
                >
                  {editingAgencyId ? "Update agency" : "Add agency"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {visibleAgencies.map((agency) => (
            <div key={agency.id} className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">{agency.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{agency.location || "No location set"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {agency.openTime && agency.closeTime
                      ? `${agency.openTime} - ${agency.closeTime}`
                      : "Hours not set"}
                  </div>
                  {(isOrgAdmin || (isTenantAdmin && activeAgencyId === agency.id)) && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditAgency(agency)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                        aria-label="Edit agency"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M4 20h4l10-10-4-4L4 16v4z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14 6l4 4" strokeLinecap="round" />
                        </svg>
                      </button>
                      {isOrgAdmin && (
                        <button
                          type="button"
                          onClick={() => deleteAgency(agency.id)}
                          className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                          aria-label="Delete agency"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M6 7h12M9 7V5h6v2M8 7l1 12h6l1-12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {agency.description && (
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{agency.description}</p>
              )}
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Contact: {agency.contact || "N/A"}
              </div>
            </div>
          ))}
          {!visibleAgencies.length && (
            <div className="text-sm text-slate-600 dark:text-slate-400">No agencies found.</div>
          )}
        </div>
      </div>
    </main>
  );
}
