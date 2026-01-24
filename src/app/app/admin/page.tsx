"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/store/session";
import { getDB } from "@/lib/db";
import type { Agency, Invite, Part, PurchaseOrder, Role, StockMovement, Supplier, User, UserAgency } from "@/lib/type";
import { uid } from "@/lib/utils";

export default function AdminPage() {
  const { tenant, user, activeAgencyId } = useSession();

  const [users, setUsers] = useState<User[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [stock, setStock] = useState<{ partId: string; qty: number }[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [memberships, setMemberships] = useState<UserAgency[]>([]);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("new.user@company.com");
  const [inviteRole, setInviteRole] = useState<Role>("TECH");
  const [inviteAgencyId, setInviteAgencyId] = useState("");

  const [membershipUserId, setMembershipUserId] = useState("");
  const [membershipAgencyId, setMembershipAgencyId] = useState("");
  const [membershipRole, setMembershipRole] = useState<Role>("TECH");
  const [inviteCopied, setInviteCopied] = useState(false);

  const isOrgAdmin = user?.role === "ORG_ADMIN";
  const isTenantAdmin = user?.role === "TENANT_ADMIN";
  const isAdminLike = isOrgAdmin || isTenantAdmin;

  const allowedInviteRoles: Role[] = isOrgAdmin
    ? ["TENANT_ADMIN", "INVENTORY_MANAGER", "PROCUREMENT_MANAGER", "ANALYST", "TECH", "WAREHOUSE", "PLANNER"]
    : ["INVENTORY_MANAGER", "PROCUREMENT_MANAGER", "ANALYST", "TECH", "WAREHOUSE", "PLANNER"];

  const headquarterAgency = useMemo(() => {
    if (!tenant?.profile?.headquarterAgencyId) return null;
    return agencies.find((agency) => agency.id === tenant.profile?.headquarterAgencyId) || null;
  }, [agencies, tenant]);

  const roleCounts = useMemo(() => {
    const counts = new Map<Role, number>();
    const source = memberships.length
      ? memberships.map((m) => m.role)
      : users.map((u) => u.role);
    source.forEach((role) => counts.set(role, (counts.get(role) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [memberships, users]);

  const usersWithoutMembership = useMemo(() => {
    const linked = new Set(memberships.map((m) => m.userId));
    return users.filter((u) => !linked.has(u.id) && !u.agencyId).length;
  }, [memberships, users]);

  const lowStockCount = useMemo(() => {
    const totals = new Map<string, number>();
    stock.forEach((row) => {
      totals.set(row.partId, (totals.get(row.partId) || 0) + row.qty);
    });
    return parts.filter((part) => (totals.get(part.id) || 0) <= part.safetyStock).length;
  }, [parts, stock]);

  const recentMovements = useMemo(() => {
    return [...movements].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  }, [movements]);

  const recentPos = useMemo(() => {
    return [...pos].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  }, [pos]);

  const activityWindowStart = useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, []);
  const recentMoveCount = useMemo(
    () => movements.filter((m) => m.createdAt >= activityWindowStart).length,
    [movements, activityWindowStart]
  );
  const recentPoCount = useMemo(
    () => pos.filter((p) => p.createdAt >= activityWindowStart).length,
    [pos, activityWindowStart]
  );

  const supplierById = useMemo(() => {
    const map = new Map<string, Supplier>();
    suppliers.forEach((s) => map.set(s.id, s));
    return map;
  }, [suppliers]);

  const partById = useMemo(() => {
    const map = new Map<string, Part>();
    parts.forEach((p) => map.set(p.id, p));
    return map;
  }, [parts]);

  const spendBySupplier = useMemo(() => {
    const totals = new Map<string, number>();
    pos.forEach((po) => {
      if (!po.vendorResponse) return;
      const spend = po.qty * po.vendorResponse.unitPrice;
      totals.set(po.supplierId, (totals.get(po.supplierId) || 0) + spend);
    });
    return totals;
  }, [pos]);

  const topSuppliers = useMemo(() => {
    return [...spendBySupplier.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([supplierId, spend]) => ({
        supplier: supplierById.get(supplierId),
        spend
      }));
  }, [spendBySupplier, supplierById]);

  const leadTimeAlerts = useMemo(
    () => pos.filter((po) => (po.vendorResponse?.leadTimeDays || 0) >= 14).length,
    [pos]
  );

  const spendTotals = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    let current = 0;
    let previous = 0;
    pos.forEach((po) => {
      if (!po.vendorResponse) return;
      const created = new Date(po.createdAt);
      const spend = po.qty * po.vendorResponse.unitPrice;
      if (created.getFullYear() === thisYear && created.getMonth() === thisMonth) {
        current += spend;
      } else if (
        created.getFullYear() === lastMonthDate.getFullYear() &&
        created.getMonth() === lastMonthDate.getMonth()
      ) {
        previous += spend;
      }
    });
    return { current, previous };
  }, [pos]);

  const currency = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
    []
  );

  const hashedValue = (input: string, min: number, max: number) => {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash * 31 + input.charCodeAt(i)) % 1000;
    }
    const range = max - min + 1;
    return min + (hash % range);
  };

  useEffect(() => {
    if (!tenant) return;

    (async () => {
      const db = await getDB();
      setUsers(await db.getAllFromIndex("users", "by_tenant", tenant.id));
      setParts(await db.getAllFromIndex("parts", "by_tenant", tenant.id));
      setStock(await db.getAllFromIndex("stock", "by_tenant", tenant.id));
      setMovements(await db.getAllFromIndex("movements", "by_tenant", tenant.id));
      setPos(await db.getAllFromIndex("pos", "by_tenant", tenant.id));
      setSuppliers(await db.getAllFromIndex("suppliers", "by_tenant", tenant.id));
      setAgencies(await db.getAllFromIndex("agencies", "by_org", tenant.id));
      setMemberships(await db.getAllFromIndex("user_agencies", "by_tenant", tenant.id));

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
    if (!allowedInviteRoles.includes(inviteRole)) return;
    if (isTenantAdmin && !activeAgencyId) return;
    if (isOrgAdmin && !inviteAgencyId) return;

    const invite: Invite = {
      id: uid("inv"),
      tenantId: tenant.id,
      email,
      role: inviteRole,
      agencyId: isOrgAdmin ? inviteAgencyId : (activeAgencyId || user?.agencyId),
      createdAt: Date.now(),
      status: "ACCEPTED",
    };

    const db = await getDB();
    const existingUsers = await db.getAllFromIndex("users", "by_tenant", tenant.id);
    let userRecord = existingUsers.find((u) => u.email.toLowerCase() === email);
    if (!userRecord) {
      userRecord = {
        id: uid("u"),
        tenantId: tenant.id,
        email,
        name: email.split("@")[0],
        role: inviteRole,
        agencyId: invite.agencyId,
        password: "Demo123!",
      };
      await db.put("users", userRecord);
    }
    if (invite.agencyId) {
      const existingMemberships = await db.getAllFromIndex("user_agencies", "by_tenant", tenant.id);
      const alreadyLinked = existingMemberships.some(
        (m) => m.userId === userRecord.id && m.agencyId === invite.agencyId
      );
      if (!alreadyLinked) {
        await db.put("user_agencies", {
          id: uid("ua"),
          tenantId: tenant.id,
          userId: userRecord.id,
          agencyId: invite.agencyId,
          role: inviteRole,
        });
      }
      setMemberships(await db.getAllFromIndex("user_agencies", "by_tenant", tenant.id));
    }

    persistInvites([invite, ...invites]);
    const inviteUrl = `${window.location.origin}/signin?tenant=${tenant.slug}&invite=${invite.id}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      // ignore clipboard errors (e.g. insecure context)
    }
    setInviteEmail("");
    setUsers(await db.getAllFromIndex("users", "by_tenant", tenant.id));
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
      agencyId: inv.agencyId,
      password: "Demo123!",
    };
    await db.put("users", newUser);
    if (inv.agencyId) {
      await db.put("user_agencies", {
        id: uid("ua"),
        tenantId: tenant.id,
        userId: newUser.id,
        agencyId: inv.agencyId,
        role: inv.role,
      });
    }

    const nextInvites = invites.map((i) =>
      i.id === inviteId ? { ...i, status: "ACCEPTED" as const } : i
    );
    persistInvites(nextInvites);
    setUsers(await db.getAllFromIndex("users", "by_tenant", tenant.id));
    setMemberships(await db.getAllFromIndex("user_agencies", "by_tenant", tenant.id));
  }

  async function deleteInvite(inviteId: string) {
    persistInvites(invites.filter((i) => i.id !== inviteId));
  }

  async function addMembership() {
    if (!tenant || !isOrgAdmin) return;
    if (!membershipUserId || !membershipAgencyId) return;
    const db = await getDB();
    await db.put("user_agencies", {
      id: uid("ua"),
      tenantId: tenant.id,
      userId: membershipUserId,
      agencyId: membershipAgencyId,
      role: membershipRole,
    });
    setMemberships(await db.getAllFromIndex("user_agencies", "by_tenant", tenant.id));
  }

  async function updateMembershipRole(membershipId: string, nextRole: Role) {
    if (!tenant || !isOrgAdmin) return;
    const db = await getDB();
    const current = memberships.find((m) => m.id === membershipId);
    if (!current) return;
    await db.put("user_agencies", { ...current, role: nextRole });
    setMemberships(await db.getAllFromIndex("user_agencies", "by_tenant", tenant.id));
  }

  async function removeMembership(membershipId: string) {
    if (!tenant || !isOrgAdmin) return;
    const db = await getDB();
    await db.delete("user_agencies", membershipId);
    setMemberships(await db.getAllFromIndex("user_agencies", "by_tenant", tenant.id));
  }

  if (!tenant) return <div className="text-sm text-gray-600 dark:text-slate-400">Loading…</div>;

  if (!isAdminLike) {
    return (
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Admin</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          You don’t have access to this page in the mock demo.
          <br />
          Switch role to <span className="font-medium">ORG_ADMIN</span> or{" "}
          <span className="font-medium">TENANT_ADMIN</span> using the role dropdown.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isOrgAdmin && (
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-amber-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
                Organization dashboard
              </p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Executive overview for {tenant?.name}
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              Last 7 days · Live snapshot
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              { label: "Total agencies", value: agencies.length.toString(), accent: "from-blue-500 to-cyan-400" },
              { label: "Total users", value: users.length.toString(), accent: "from-emerald-500 to-lime-400" },
              {
                label: "Active roles",
                value: roleCounts.length.toString(),
                accent: "from-amber-500 to-orange-400"
              },
              {
                label: "Headquarter agency",
                value: headquarterAgency?.name || headquarterAgency?.location || "Not set",
                accent: "from-indigo-500 to-blue-400"
              }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70"
              >
                <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${item.accent}`} />
                <p className="mt-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Activity rollup</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">All agencies</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recent stock moves</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {recentMoveCount}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">New POs</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{recentPoCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Low-stock alerts</p>
                  <p className="mt-1 text-lg font-semibold text-rose-600">{lowStockCount}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Recent moves
                  </p>
                  <div className="mt-2 space-y-2">
                    {recentMovements.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                      >
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{m.type}</span>
                        <span>
                          {partById.get(m.partId)?.sku || "Part"} · {m.qty}
                        </span>
                      </div>
                    ))}
                    {!recentMovements.length && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">No movements yet.</div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Recent POs</p>
                  <div className="mt-2 space-y-2">
                    {recentPos.map((po) => (
                      <div
                        key={po.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                      >
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{po.status}</span>
                        <span>
                          {supplierById.get(po.supplierId)?.name || "Supplier"} · {po.qty}
                        </span>
                      </div>
                    ))}
                    {!recentPos.length && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">No POs yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Invitations & access</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pending invites</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {invites.filter((i) => i.status === "PENDING").length}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Users without agency</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {usersWithoutMembership}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Role distribution</p>
                  <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {roleCounts.slice(0, 4).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between">
                        <span>{role}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{count}</span>
                      </div>
                    ))}
                    {!roleCounts.length && <div className="text-xs text-slate-500">No roles yet.</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Agency health</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">KPIs per agency</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {agencies.map((agency) => {
                const accuracy = hashedValue(agency.id, 92, 99);
                const openOrders = pos.length === 0 ? 0 : hashedValue(agency.id, 0, pos.length);
                const lastCount = hashedValue(agency.id, 2, 28);
                return (
                  <div
                    key={agency.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{agency.name}</p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{agency.location}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Stock accuracy</p>
                        <p className="mt-1 font-semibold text-emerald-600">{accuracy}%</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Open orders</p>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{openOrders}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Last count</p>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{lastCount}d</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!agencies.length && (
                <div className="text-sm text-slate-500 dark:text-slate-400">No agencies yet.</div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Procurement overview</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Top suppliers
                  </p>
                  <div className="mt-2 space-y-2">
                    {topSuppliers.map((entry, index) => (
                      <div
                        key={`${entry.supplier?.id || index}`}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                      >
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {entry.supplier?.name || "Supplier"}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">{currency.format(entry.spend)}</span>
                      </div>
                    ))}
                    {!topSuppliers.length && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">No spend yet.</div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Spend trend</p>
                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>This month</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {currency.format(spendTotals.current)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Last month</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {currency.format(spendTotals.previous)}
                      </span>
                    </div>
                    <div className="mt-3 rounded-lg bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-2 rounded-lg bg-emerald-500"
                        style={{
                          width:
                            spendTotals.previous === 0
                              ? "70%"
                              : `${Math.min(100, (spendTotals.current / spendTotals.previous) * 100)}%`
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Lead-time alerts: <span className="font-semibold text-rose-600">{leadTimeAlerts}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick actions</h3>
              <div className="mt-4 space-y-3">
                <Link
                  href="/app/agency"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Add new agency
                  <span className="text-xs font-semibold text-blue-600">→</span>
                </Link>
                <a
                  href="#invite-users"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Invite tenant admin
                  <span className="text-xs font-semibold text-emerald-600">→</span>
                </a>
                <Link
                  href="/app/reports"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Create global report
                  <span className="text-xs font-semibold text-amber-600">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Invite users */}
      <section
        id="invite-users"
        className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900"
      >
        <h3 className="font-semibold">Invite users</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          This simulates email invitations. “Accept” creates the user locally with password Demo123!.
        </p>
        {isTenantAdmin && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Tenant admins can only invite users for their own agency.
          </p>
        )}
        {inviteCopied && (
          <p className="mt-2 text-xs font-semibold text-emerald-600">
            Invite link copied to clipboard.
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium">Email</label>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              placeholder="user@company.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              {allowedInviteRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          {isOrgAdmin && (
            <div>
              <label className="text-xs font-medium">Agency</label>
              <select
                value={inviteAgencyId}
                onChange={(e) => setInviteAgencyId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="">Select agency</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button
              onClick={createInvite}
              className="w-full rounded-xl bg-gray-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Create invite
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {invites.map((i) => (
            <div
              key={i.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl border border-gray-200 p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <div>
                <div className="text-sm font-medium">{i.email}</div>
                <div className="text-xs text-gray-600 dark:text-slate-400">
                  Role: {i.role} · Status: {i.status}
                </div>
              </div>
              <div className="flex gap-2">
                {i.status === "PENDING" && (
                  <button
                    onClick={() => acceptInvite(i.id)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    Accept (mock)
                  </button>
                )}
                <button
                  onClick={() => deleteInvite(i.id)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {!invites.length && (
            <div className="text-sm text-gray-600 dark:text-slate-400">No invites yet.</div>
          )}
        </div>
      </section>

      {isOrgAdmin && (
        <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-semibold">Agency memberships</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            Assign users to agencies and set roles per agency.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium">User</label>
              <select
                value={membershipUserId}
                onChange={(e) => setMembershipUserId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Agency</label>
              <select
                value={membershipAgencyId}
                onChange={(e) => setMembershipAgencyId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="">Select agency</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Role</label>
              <select
                value={membershipRole}
                onChange={(e) => setMembershipRole(e.target.value as Role)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              >
                {allowedInviteRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={addMembership}
                className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add membership
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-auto rounded-xl border border-gray-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-950">
                <tr>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Agency</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-right p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((membership) => {
                  const membershipUser = users.find((u) => u.id === membership.userId);
                  const membershipAgency = agencies.find((a) => a.id === membership.agencyId);
                  return (
                    <tr key={membership.id} className="border-t">
                      <td className="p-2">
                        <div className="text-sm font-medium">{membershipUser?.name || membership.userId}</div>
                        <div className="text-xs text-gray-600 dark:text-slate-400">
                          {membershipUser?.email || "—"}
                        </div>
                      </td>
                      <td className="p-2">{membershipAgency?.name || membership.agencyId}</td>
                      <td className="p-2">
                        <select
                          value={membership.role}
                          onChange={(e) => updateMembershipRole(membership.id, e.target.value as Role)}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm dark:border-slate-800 dark:bg-slate-950"
                        >
                          {allowedInviteRoles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeMembership(membership.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!memberships.length && (
                  <tr>
                    <td className="p-3 text-gray-600 dark:text-slate-400" colSpan={4}>
                      No memberships yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Users list */}
      <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold">Users</h3>
        <div className="mt-3 overflow-auto rounded-xl border border-gray-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-950">
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
                  <td className="p-3 text-gray-600 dark:text-slate-400" colSpan={3}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
