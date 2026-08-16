"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useCart } from "@/lib/cart-context";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const EXIT_DURATION_MS = 200;

interface OrderConfirmation {
  orderId: string;
  totalCents: number;
}

export function CartSheet({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { items, updateQuantity, removeItem, clear, totalCents } = useCart();
  const [visible, setVisible] = useState(false);
  const [tableLabel, setTableLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

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

  async function handlePlaceOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.post<{ orderId: string; status: string; totalCents: number }>(
        `/api/public/menu/${slug}/orders`,
        {
          tableLabel: tableLabel.trim() || undefined,
          notes: notes.trim() || undefined,
          items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        }
      );
      setConfirmation({ orderId: result.orderId, totalCents: result.totalCents });
      clear();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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

        {confirmation ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
              </svg>
            </span>
            <h3 className="text-lg font-bold text-gray-900">Order sent!</h3>
            <p className="text-sm text-gray-500">
              Your order for {formatPrice(confirmation.totalCents)} has been sent to the kitchen.
              {tableLabel.trim() && ` Show this to staff if they ask which table — ${tableLabel.trim()}.`}
            </p>
            <button
              onClick={handleClose}
              className="mt-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 pt-2 sm:pt-4">
              <h3 className="text-base font-bold text-gray-900">Your order</h3>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">Your cart is empty.</p>
            ) : (
              <>
                <ul className="flex flex-col gap-3 px-4 py-4">
                  {items.map((item) => (
                    <li key={item.menuItemId} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400">{formatPrice(item.priceCents)} each</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="flex items-center gap-2 rounded-full border border-gray-200 px-1 py-1">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            aria-label={`Decrease ${item.name} quantity`}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                          >
                            −
                          </button>
                          <span className="w-4 text-center text-xs font-semibold text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            aria-label={`Increase ${item.name} quantity`}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.menuItemId)}
                          aria-label={`Remove ${item.name}`}
                          className="text-gray-300 hover:text-red-500"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Table (optional)</label>
                    <input
                      value={tableLabel}
                      onChange={(e) => setTableLabel(e.target.value)}
                      maxLength={40}
                      placeholder="e.g. Table 5"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={300}
                      rows={2}
                      placeholder="Allergies, special requests..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-sm font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(totalCents)}</span>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="rounded-full bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                  >
                    {submitting ? "Sending order..." : "Place order"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
