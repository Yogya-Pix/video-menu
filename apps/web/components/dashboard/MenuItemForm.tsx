"use client";

import { useState } from "react";
import type { Category } from "@/lib/types";

export interface MenuItemFormValues {
  name: string;
  description: string;
  price: string; // dollars, as typed by the user
  categoryId: string;
  isAvailable: boolean;
}

export function MenuItemForm({
  initial,
  categories,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<MenuItemFormValues>;
  categories: Category[];
  submitLabel: string;
  onSubmit: (values: MenuItemFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<MenuItemFormValues>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? "",
    categoryId: initial?.categoryId ?? "",
    isAvailable: initial?.isAvailable ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      await onSubmit(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
        <input
          required
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Price (USD)</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(e) => setValues({ ...values, price: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
          <select
            value={values.categoryId}
            onChange={(e) => setValues({ ...values, categoryId: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={values.isAvailable}
          onChange={(e) => setValues({ ...values, isAvailable: e.target.checked })}
        />
        Available on the menu
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
        {saved && <span className="text-sm text-green-600">Saved.</span>}
      </div>
    </form>
  );
}
