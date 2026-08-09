import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { PublicMenuResponse } from "@/lib/types";
import { DishCard } from "@/components/DishCard";

async function getMenu(slug: string): Promise<PublicMenuResponse | null> {
  try {
    return await api.get<PublicMenuResponse>(`/api/public/menu/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export default async function MenuPage({ params }: { params: { slug: string } }) {
  const menu = await getMenu(params.slug);
  if (!menu) notFound();

  const { restaurant, categories, items } = menu;
  const uncategorized = items.filter((item) => !item.categoryId);

  return (
    <main className="mx-auto min-h-screen max-w-md pb-16">
      <header className="px-4 pb-4 pt-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
        {restaurant.description && <p className="mt-1 text-sm text-gray-500">{restaurant.description}</p>}
      </header>

      {items.length === 0 ? (
        <p className="px-4 text-center text-sm text-gray-400">This menu isn&apos;t available yet — check back soon.</p>
      ) : (
        <div className="flex flex-col gap-10 px-4">
          {categories.map((category) => {
            const categoryItems = items.filter((item) => item.categoryId === category.id);
            if (categoryItems.length === 0) return null;
            return (
              <section key={category.id} className="flex flex-col gap-5">
                <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
                {categoryItems.map((item) => (
                  <DishCard key={item.id} item={item} />
                ))}
              </section>
            );
          })}

          {uncategorized.length > 0 && (
            <section className="flex flex-col gap-5">
              {categories.length > 0 && <h2 className="text-lg font-bold text-gray-900">More</h2>}
              {uncategorized.map((item) => (
                <DishCard key={item.id} item={item} />
              ))}
            </section>
          )}
        </div>
      )}
    </main>
  );
}
