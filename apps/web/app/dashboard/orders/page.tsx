"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";

const TABS: { id: OrderStatus; label: string }[] = [
  { id: "PENDING", label: "Pending" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
];

const POLL_INTERVAL_MS = 10_000;

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("PENDING");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load(status: OrderStatus) {
    const { orders } = await api.get<{ orders: Order[] }>(`/api/orders?status=${status}`);
    setOrders(orders);
  }

  useEffect(() => {
    setLoading(true);
    load(activeTab).finally(() => setLoading(false));

    const interval = setInterval(() => load(activeTab), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeTab]);

  async function handleUpdateStatus(orderId: string, status: "COMPLETED" | "CANCELLED") {
    setUpdatingId(orderId);
    try {
      await api.patch(`/api/orders/${orderId}`, { status });
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-gray-400">No {activeTab.toLowerCase()} orders.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{order.tableLabel || "Order"}</p>
                  <p className="text-xs text-gray-400">{relativeTime(order.createdAt)}</p>
                </div>
                <span className="text-sm font-semibold text-brand-600">{formatPrice(order.totalCents)}</span>
              </div>

              <ul className="mb-3 flex flex-col gap-1">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm text-gray-700">
                    <span>
                      {item.quantity} × {item.nameSnapshot}
                    </span>
                    <span className="text-gray-400">{formatPrice(item.priceCentsSnapshot * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              {order.notes && <p className="mb-3 text-xs text-gray-500">Note: {order.notes}</p>}

              {activeTab === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                    disabled={updatingId === order.id}
                    className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                  >
                    Mark complete
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                    disabled={updatingId === order.id}
                    className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
