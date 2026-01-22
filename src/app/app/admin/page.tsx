"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/store/session";
import { getDB } from "@/lib/db";
import type { Role, Supplier, User } from "@/lib/type";
import { uid } from "@/lib/utils";

type Invite = {
  id: string;
  tenantId: string;
  email: string;
  role: Role;
  createdAt: number;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
};

export default function AdminPage() {
  const { tenant, user } = useSession();

  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("new.user@company.com");
  const [inviteRole, setInviteRole] = useState<Role>("TECH");

  // Supplier form
  const [supplierName, setSupplierName] = useState("New Supplier Ltd.");
  const [supplierEmail, setSupplierEmail] = useState("sales@newsupplier.com");

  const isAdminLike = useMemo(() => {
    // In this mocked app we treat Procurement as "admin-like" for demo.
    // If you add a real ADMIN role later, change this check.
    return user?.role === "PROCUREMENT";
  }, [user]);

  useEffect(() => {
    if (!tenant) return;

    (async () => {
      const db = await getDB();
      setUsers(await db.getAllFromIndex("users", "by_tenant", tenant.id));
      setSuppliers(await db.getAllFromIndex("suppliers", "by_tenant", tenant.id));

      // invites store is not in the original DB schema; we keep it simple with localStorage.
      const raw = localStorage.getItem(`yowspare_invites_${tenant.id}`);
      setInvites(raw ? (JSON.parse(raw) as Invite[]) : []);
    })();
  }, [tenant]);

  function persistInvites(next: Invite[]) {
    if (!tenant) return;
    setInvites(next);
    localStorage.setItem(`yowspare_invites_${tenant.id}`, JSON.stringify(next));
  }

  async function createInvite() {
    if (!tenant) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    const invite: Invite = {
      id: uid("inv"),
      tenantId: tenant.id,
      email,
      role: inviteRole,
      createdAt: Date.now(),
      status: "PENDING",
    };

    persistInvites([invite, ...invites]);
    setInviteEmail("");
  }

  async function acceptInvite(inviteId: string) {
    if (!tenant) return;

    const inv = invites.find((i) => i.id === inviteId);
    if (!inv || inv.status !== "PENDING") return;

    // Create the user locally (mock “accepted invitation”)
    const db = await getDB();
    const newUser: User = {
      id: uid("u"),
      tenantId: tenant.id,
      email: inv.email,
      name: inv.email.split("@")[0],
      role: inv.role,
    };
    await db.put("users", newUser);

    const nextInvites = invites.map((i) =>
      i.id === inviteId ? { ...i, status: "ACCEPTED" as const } : i
    );
    persistInvites(nextInvites);
    setUsers(await db.getAllFromIndex("users", "by_tenant", tenant.id));
  }

  async function deleteInvite(inviteId: string) {
    persistInvites(invites.filter((i) => i.id !== inviteId));
  }

  async function addSupplier() {
    if (!tenant) return;
    const name = supplierName.trim();
    const email = supplierEmail.trim().toLowerCase();
    if (!name || !email) return;

    const db = await getDB();
    const sup: Supplier = {
      id: uid("s"),
      tenantId: tenant.id,
      name,
      email,
    };
    await db.put("suppliers", sup);

    setSuppliers(await db.getAllFromIndex("suppliers", "by_tenant", tenant.id));
    setSupplierName("");
    setSupplierEmail("");
  }

  if (!tenant) return <div className="text-sm text-gray-600">Loading…</div>;

  if (!isAdminLike) {
    return (
      <div className="rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">Admin</h2>
        <p className="mt-2 text-sm text-gray-600">
          You don’t have access to this page in the mock demo.
          <br />
          Switch role to <span className="font-medium">PROCUREMENT</span> using the role dropdown.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">Admin</h2>
        <p className="mt-1 text-sm text-gray-600">
          Offline mock admin: invite users + manage suppliers (stored locally).
        </p>
      </div>

      {/* Invite users */}
      <section className="rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold">Invite users</h3>
        <p className="mt-1 text-sm text-gray-600">
          This simulates email invitations. “Accept” creates the user locally.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium">Email</label>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="user@company.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="PROCUREMENT">PROCUREMENT</option>
              <option value="WAREHOUSE">WAREHOUSE</option>
              <option value="TECH">TECH</option>
              <option value="PLANNER">PLANNER</option>
              <option value="SUPPLIER">SUPPLIER</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={createInvite}
              className="w-full rounded-xl bg-gray-900 px-4 py-2 text-white"
            >
              Create invite
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {invites.map((i) => (
            <div
              key={i.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl border border-gray-200 p-3"
            >
              <div>
                <div className="text-sm font-medium">{i.email}</div>
                <div className="text-xs text-gray-600">
                  Role: {i.role} · Status: {i.status}
                </div>
              </div>
              <div className="flex gap-2">
                {i.status === "PENDING" && (
                  <button
                    onClick={() => acceptInvite(i.id)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Accept (mock)
                  </button>
                )}
                <button
                  onClick={() => deleteInvite(i.id)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {!invites.length && (
            <div className="text-sm text-gray-600">No invites yet.</div>
          )}
        </div>
      </section>

      {/* Users list */}
      <section className="rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold">Users</h3>
        <div className="mt-3 overflow-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td className="p-3 text-gray-600" colSpan={3}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Suppliers */}
      <section className="rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold">Suppliers</h3>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium">Supplier name</label>
            <input
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Supplier name"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Supplier email</label>
            <input
              value={supplierEmail}
              onChange={(e) => setSupplierEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="sales@supplier.com"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addSupplier}
              className="w-full rounded-xl bg-gray-900 px-4 py-2 text-white"
            >
              Add supplier
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {suppliers.map((s) => (
            <div key={s.id} className="rounded-xl border border-gray-200 p-3">
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-gray-600">{s.email}</div>
            </div>
          ))}
          {!suppliers.length && (
            <div className="text-sm text-gray-600">No suppliers yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
