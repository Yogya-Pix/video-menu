"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Category, MenuItem } from "@/lib/types";
import { MenuItemForm, type MenuItemFormValues } from "@/components/dashboard/MenuItemForm";
import { DishVideoManager } from "@/components/dashboard/DishVideoManager";

export default function EditMenuItemPage({ params }: { params: { itemId: string } }) {
  const router = useRouter();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ item: MenuItem }>(`/api/menu/items/${params.itemId}`),
      api.get<{ categories: Category[] }>("/api/menu/categories"),
    ]).then(([i, c]) => {
      setItem(i.item);
      setCategories(c.categories);
      setLoading(false);
    });
  }, [params.itemId]);

  async function handleSubmit(values: MenuItemFormValues) {
    const { item: updated } = await api.patch<{ item: MenuItem }>(`/api/menu/items/${params.itemId}`, {
      name: values.name,
      description: values.description || undefined,
      priceCents: Math.round(parseFloat(values.price) * 100),
      categoryId: values.categoryId || null,
      isAvailable: values.isAvailable,
    });
    setItem(updated);
  }

  async function handleDelete() {
    if (!confirm("Delete this menu item? This can't be undone.")) return;
    await api.delete(`/api/menu/items/${params.itemId}`);
    router.push("/dashboard/menu");
  }

  if (loading || !item) {
    return <p className="text-sm text-gray-400">Loading item...</p>;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Edit {item.name}</h1>
        <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">
          Delete item
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Dish videos</p>
        <DishVideoManager itemId={item.id} videos={item.videos} onUpdated={setItem} />
      </div>

      <MenuItemForm
        categories={categories}
        submitLabel="Save changes"
        initial={{
          name: item.name,
          description: item.description ?? "",
          price: (item.priceCents / 100).toString(),
          categoryId: item.categoryId ?? "",
          isAvailable: item.isAvailable,
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
