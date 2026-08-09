"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface QrCodeResponse {
  qrCodeUrl: string;
  menuUrl: string;
}

export function QrCodeCard() {
  const [data, setData] = useState<QrCodeResponse | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const FRIENDLY_ERROR = "Couldn't load your QR code yet. This usually means video storage hasn't been set up — check back once that's configured.";

  useEffect(() => {
    api
      .get<QrCodeResponse>("/api/qrcode")
      .then(setData)
      .catch(() => setError(FRIENDLY_ERROR));
  }, []);

  async function handleRegenerate() {
    setRegenerating(true);
    setError(null);
    try {
      const result = await api.post<QrCodeResponse>("/api/qrcode/regenerate");
      setData(result);
    } catch {
      setError(FRIENDLY_ERROR);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-1 text-sm font-semibold text-gray-900">Table QR code</h2>
      <p className="mb-4 text-xs text-gray-400">Print this and place it on tables — scanning it opens your public menu.</p>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {data ? (
        <div className="flex flex-col items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.qrCodeUrl} alt="Menu QR code" className="h-48 w-48 rounded-lg border border-gray-200" />
          <a href={data.menuUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">
            {data.menuUrl}
          </a>
          <div className="flex gap-3">
            <a
              href={data.qrCodeUrl}
              download="menu-qr-code.png"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Download PNG
            </a>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-60"
            >
              {regenerating ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        </div>
      ) : (
        !error && <p className="text-sm text-gray-400">Loading QR code...</p>
      )}
    </div>
  );
}
