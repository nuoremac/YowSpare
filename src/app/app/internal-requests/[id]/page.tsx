"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ApprovalStatus, InternalRequest } from "@/lib/workflowStore";
import { nowIso, readWorkflowState, updateWorkflowState } from "@/lib/workflowStore";
import { useSession } from "@/store/session";
import { hasAuthority, hasFullOrganizationAccess } from "@/lib/accessControl";

const ACTIONS: Array<{ label: string; next: ApprovalStatus }> = [
  { label: "Approuver", next: "APPROVED" },
  { label: "Rejeter", next: "REJECTED" },
  { label: "En cours", next: "IN_PROGRESS" },
  { label: "Terminer", next: "COMPLETED" },
];

export default function InternalRequestDetailPage() {
  const { roles, tenant, user } = useSession();
  const canManageRequest =
    hasFullOrganizationAccess({ authorities: roles, user, organization: tenant }) ||
    hasAuthority(roles, "resources:write");
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const [request, setRequest] = useState<InternalRequest | null>(null);
  const [note, setNote] = useState("");

  const load = () => {
    const state = readWorkflowState();
    const found = state.internalRequests.find((r) => r.id === id) || null;
    setRequest(found);
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = (next: ApprovalStatus) => {
    if (!request || !canManageRequest) return;
    const at = nowIso();
    updateWorkflowState((state) => ({
      ...state,
      internalRequests: state.internalRequests.map((r) =>
        r.id !== request.id
          ? r
          : {
              ...r,
              status: next,
              updatedAt: at,
              events: [
                { at, action: `STATUS_${next}`, note: note.trim() || undefined },
                ...(r.events || []),
              ],
            }
      ),
    }));
    setNote("");
    load();
  };

  const statusTone = useMemo(() => {
    if (!request) return "bg-muted text-foreground";
    if (request.status === "REJECTED") return "bg-rose-100 text-rose-700";
    if (request.status === "APPROVED") return "bg-emerald-100 text-emerald-700";
    if (request.status === "IN_PROGRESS") return "bg-blue-100 text-blue-700";
    if (request.status === "COMPLETED") return "bg-violet-100 text-violet-700";
    return "bg-amber-100 text-amber-800";
  }, [request]);

  if (!request) {
    return (
      <main className="ys-page">
        <section className="ys-page-header">
          <h2 className="ys-page-title">Demande introuvable</h2>
          <p className="ys-page-subtitle">La demande n'existe pas ou a ete supprimee.</p>
        </section>
        <Link href="/app/internal-requests" className="ys-btn-secondary w-fit">
          Retour a la liste
        </Link>
      </main>
    );
  }

  return (
    <main className="ys-page">
      <section className="ys-page-header">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="ys-page-title">Demande #{request.id.slice(0, 8)}</h2>
            <p className="ys-page-subtitle">Suivi complet de la demande interne.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>{request.status}</span>
        </div>
      </section>

      <section className="ys-card p-5">
        <div className="ys-section-title">Informations</div>
        <ul className="mt-3 divide-y divide-border text-sm">
          <li className="flex justify-between gap-4 py-2">
            <span className="text-muted-foreground">Departement</span>
            <span className="font-medium">{request.department}</span>
          </li>
          <li className="flex justify-between gap-4 py-2">
            <span className="text-muted-foreground">Produit</span>
            <span className="font-medium">{request.productLabel}</span>
          </li>
          <li className="flex justify-between gap-4 py-2">
            <span className="text-muted-foreground">Quantite</span>
            <span className="font-medium">{request.quantity}</span>
          </li>
          <li className="flex justify-between gap-4 py-2">
            <span className="text-muted-foreground">Periode</span>
            <span className="font-medium">
              {request.neededFrom || "—"} → {request.neededTo || "—"}
            </span>
          </li>
          <li className="flex justify-between gap-4 py-2">
            <span className="text-muted-foreground">Motif</span>
            <span className="font-medium">{request.reason}</span>
          </li>
        </ul>
      </section>

      <section className="ys-card p-5">
        <div className="ys-section-title">Action</div>
        <textarea
          className="ys-input mt-3 min-h-24"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ajouter un commentaire de decision"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {ACTIONS.map((it) => (
            <button
              key={it.next}
              type="button"
              onClick={() => updateStatus(it.next)}
              disabled={!canManageRequest}
              className={it.next === "REJECTED" ? "ys-btn-danger" : "ys-btn-primary"}
            >
              {it.label}
            </button>
          ))}
        </div>
      </section>

      <section className="ys-card p-5">
        <div className="ys-section-title">Trace</div>
        <div className="mt-3 space-y-2">
          {(request.events || []).map((event, idx) => (
            <div key={`${event.at}-${idx}`} className="border border-border rounded-xl px-3 py-2 text-sm">
              <div className="font-medium">{event.action}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(event.at).toLocaleString()} {event.note ? `• ${event.note}` : ""}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
