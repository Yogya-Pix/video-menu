"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";

export function CategoryManager({
  categories,
  onChange,
}: {
  categories: Category[];
  onChange: (categories: Category[]) => void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { category } = await api.post<{ category: Category }>("/api/menu/categories", { name: name.trim() });
      onChange([...categories, category]);
      setName("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/menu/categories/${id}`);
    onChange(categories.filter((c) => c.id !== id));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Categories</h2>
      <ul className="mb-3 flex flex-wrap gap-2">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
            {c.name}
            <button
              onClick={() => handleDelete(c.id)}
              aria-label={`Delete ${c.name}`}
              className="ml-1 text-gray-400 hover:text-red-600"
            >
              ×
            </button>
          </li>
        ))}
        {categories.length === 0 && <li className="text-xs text-gray-400">No categories yet</li>}
      </ul>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          Add
        </button>
      </form>
    </div>
  );
}
