"use client";

import { useCart } from "@/lib/cart-context";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function CartBar({ onOpen }: { onOpen: () => void }) {
  const { items, totalCents, totalQuantity } = useCart();

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-4">
      <button
        onClick={onOpen}
        className="flex w-full max-w-sm items-center justify-between rounded-full bg-gray-900 px-5 py-3.5 text-white shadow-xl transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-900">
            {totalQuantity}
          </span>
          View order
        </span>
        <span className="text-sm font-semibold">{formatPrice(totalCents)}</span>
      </button>
    </div>
  );
}
