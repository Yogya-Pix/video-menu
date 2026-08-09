"use client";

import { useMemo, useState } from "react";
import { CategoryNav } from "./CategoryNav";
import { DishGridCard } from "./DishGridCard";
import { DishModal } from "./DishModal";
import type { PublicMenuItem } from "@/lib/types";

const UNCATEGORIZED_ID = "__uncategorized__";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-gray-300">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 3v4.5m3.75-4.5v4.5m3.75-4.5v4.5M6 7.5h12a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19.5V9A1.5 1.5 0 0 1 6 7.5Z"
        />
      </svg>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

export function MenuBrowser({
  categories,
  items,
}: {
  categories: { id: string; name: string }[];
  items: PublicMenuItem[];
}) {
  const hasUncategorized = items.some((item) => !item.categoryId);

  const tabs = useMemo(() => {
    const base = categories.map((c) => ({ id: c.id, name: c.name }));
    return hasUncategorized ? [...base, { id: UNCATEGORIZED_ID, name: "More" }] : base;
  }, [categories, hasUncategorized]);

  const [activeId, setActiveId] = useState(tabs[0]?.id ?? UNCATEGORIZED_ID);
  const [openItem, setOpenItem] = useState<PublicMenuItem | null>(null);

  const visibleItems = items.filter((item) =>
    activeId === UNCATEGORIZED_ID ? !item.categoryId : item.categoryId === activeId
  );

  if (items.length === 0) {
    return <EmptyState message="This menu isn't available yet — check back soon." />;
  }

  return (
    <div>
      <CategoryNav tabs={tabs} activeId={activeId} onSelect={setActiveId} />

      {visibleItems.length === 0 ? (
        <EmptyState message="Nothing in this category yet." />
      ) : (
        <div key={activeId} className="animate-fade-in-up grid grid-cols-2 gap-4 px-4 py-5">
          {visibleItems.map((item) => (
            <DishGridCard key={item.id} item={item} onOpen={() => setOpenItem(item)} />
          ))}
        </div>
      )}

      {openItem && <DishModal item={openItem} onClose={() => setOpenItem(null)} />}
    </div>
  );
}
