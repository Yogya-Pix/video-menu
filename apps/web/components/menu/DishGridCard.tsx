"use client";

import type { PublicMenuItem } from "@/lib/types";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function DishGridCard({ item, onOpen }: { item: PublicMenuItem; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col gap-2 text-left transition-transform active:scale-[0.97]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-active:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-gray-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 5h16v14H4V5Zm0 10 4.5-4.5a1 1 0 0 1 1.4 0L14 14.5m0 0 1.6-1.6a1 1 0 0 1 1.4 0L20 15.5M9 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
              />
            </svg>
            <span className="text-[11px] font-medium text-gray-300">No photo yet</span>
          </div>
        )}
        {item.videoUrl && (
          <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white shadow-sm backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}
      </div>
      <div>
        <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
        <p className="text-sm font-medium text-brand-600">{formatPrice(item.priceCents)}</p>
      </div>
    </button>
  );
}
