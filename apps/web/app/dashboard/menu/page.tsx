"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Category, MenuItem } from "@/lib/types";
import { CategoryManager } from "@/components/dashboard/CategoryManager";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function MenuManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ categories: Category[] }>("/api/menu/categories"),
      api.get<{ items: MenuItem[] }>("/api/menu/items"),
    ]).then(([c, i]) => {
      setCategories(c.categories);
      setItems(i.items);
      setLoading(false);
    });
  }, []);

  async function handleDeleteItem(id: string) {
    if (!confirm("Delete this menu item? This can't be undone.")) return;
    await api.delete(`/api/menu/items/${id}`);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Loading menu...</p>;
  }

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  return (
    <div className="flex flex-col gap-6">
      <CategoryManager categories={categories} onChange={setCategories} />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Menu items</h2>
        <Link
          href="/dashboard/menu/new"
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Add item
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No menu items yet. Add your first dish to get started.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-4 py-3">
              {item.videos[0]?.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.videos[0].thumbnailUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-[10px] text-gray-400">
                  No image
                </div>
              )}

              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400">
                  {categoryName(item.categoryId)} · {formatPrice(item.priceCents)}
                  {!item.isAvailable && " · Hidden"}
                </p>
              </div>

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  item.videos.length > 0 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {item.videos.length === 0
                  ? "No video"
                  : item.videos.length === 1
                    ? "1 video"
                    : `${item.videos.length} videos`}
              </span>

              <Link href={`/dashboard/menu/${item.id}`} className="text-sm text-brand-600 hover:underline">
                Edit
              </Link>
              <button onClick={() => handleDeleteItem(item.id)} className="text-sm text-gray-400 hover:text-red-600">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
