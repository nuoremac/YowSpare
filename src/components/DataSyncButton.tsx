"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/store/session";
import { getPendingCount, mockSyncNow } from "@/lib/sync";

export default function DataSyncButton() {
  const { tenant } = useSession();
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    let alive = true;

    const tick = async () => {
      const n = await getPendingCount(tenant.id);
      if (alive) setPending(n);
    };

    tick();
    const id = setInterval(tick, 1500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [tenant]);

  async function sync() {
    if (!tenant || !navigator.onLine) return;
    setBusy(true);
    try {
      await mockSyncNow(tenant.id);
      setPending(await getPendingCount(tenant.id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={sync}
      disabled={!navigator.onLine || busy || !tenant}
      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm disabled:opacity-40"
      title="Mock sync: marks queued operations as synced"
    >
      Sync {pending ? `(${pending})` : ""}
    </button>
  );
}
