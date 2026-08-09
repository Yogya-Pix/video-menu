"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Category, MenuItem } from "@/lib/types";
import { MenuItemForm, type MenuItemFormValues } from "@/components/dashboard/MenuItemForm";

export default function NewMenuItemPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get<{ categories: Category[] }>("/api/menu/categories").then((r) => setCategories(r.categories));
  }, []);

  async function handleSubmit(values: MenuItemFormValues) {
    const { item } = await api.post<{ item: MenuItem }>("/api/menu/items", {
      name: values.name,
      description: values.description || undefined,
      priceCents: Math.round(parseFloat(values.price) * 100),
      categoryId: values.categoryId || null,
      isAvailable: values.isAvailable,
    });
    router.push(`/dashboard/menu/${item.id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-lg font-bold text-gray-900">Add menu item</h1>
      <MenuItemForm categories={categories} submitLabel="Create item" onSubmit={handleSubmit} />
      <p className="mt-3 text-xs text-gray-400">You can upload the dish video after creating the item.</p>
    </div>
  );
}
