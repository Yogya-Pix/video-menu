"use client";

import { useState } from "react";
import { useSession } from "@/lib/session-context";
import { api } from "@/lib/api";
import { QrCodeCard } from "@/components/dashboard/QrCodeCard";

export default function DashboardOverviewPage() {
  const { session, refresh } = useSession();
  const [name, setName] = useState(session?.restaurant.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!session) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.patch("/api/restaurant/me", { name });
      await refresh();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Restaurant profile</h2>
        <p className="mb-4 text-xs text-gray-400">This name appears at the top of your public menu.</p>
        <form onSubmit={handleSave} className="flex max-w-sm gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
        {saved && <p className="mt-2 text-xs text-green-600">Saved.</p>}
      </div>

      <QrCodeCard />
    </div>
  );
}
