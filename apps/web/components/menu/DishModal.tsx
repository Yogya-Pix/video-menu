"use client";

import { useEffect, useState } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import type { PublicMenuItem } from "@/lib/types";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const EXIT_DURATION_MS = 200;

export function DishModal({ item, onClose }: { item: PublicMenuItem; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, EXIT_DURATION_MS);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-20 flex items-end justify-center transition-colors duration-200 sm:items-center sm:px-4 sm:py-8 ${
        visible ? "bg-black/80" : "bg-black/0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`flex max-h-[92vh] w-full max-w-sm flex-col overflow-y-auto rounded-t-3xl bg-white shadow-2xl transition-transform duration-200 ease-out sm:rounded-2xl ${
          visible ? "translate-y-0" : "translate-y-full sm:translate-y-6 sm:opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pb-1 pt-2.5 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="relative">
          <VideoPlayer videoUrl={item.videoUrl} thumbnailUrl={item.thumbnailUrl} label={item.name} />
          <button
            onClick={handleClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white sm:left-3 sm:right-auto"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex items-start justify-between gap-3 p-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
            {item.description && <p className="mt-1 text-sm text-gray-500">{item.description}</p>}
          </div>
          <span className="whitespace-nowrap text-base font-semibold text-brand-600">
            {formatPrice(item.priceCents)}
          </span>
        </div>
      </div>
    </div>
  );
}
