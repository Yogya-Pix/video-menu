import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { PublicMenuResponse } from "@/lib/types";
import { MenuBrowser } from "@/components/menu/MenuBrowser";

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

  return (
    <main className="mx-auto min-h-screen max-w-md bg-neutral-50 pb-16">
      <header className="flex flex-col items-center gap-3 px-4 pb-5 pt-9 text-center">
        {restaurant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.logoUrl}
            alt={restaurant.name}
            className="h-16 w-16 rounded-full border border-gray-200 object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-lg font-bold text-brand-600">
            {restaurant.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{restaurant.name}</h1>
          {restaurant.description && <p className="mt-1 text-sm text-gray-500">{restaurant.description}</p>}
        </div>
      </header>

      <MenuBrowser slug={params.slug} categories={categories} items={items} />
    </main>
  );
}
