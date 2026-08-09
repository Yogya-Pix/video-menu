"use client";

import { useEffect, useRef } from "react";

export interface CategoryTab {
  id: string;
  name: string;
}

export function CategoryNav({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: CategoryTab[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeId]);

  if (tabs.length <= 1) return null;

  return (
    <nav className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-gray-900/95 px-4 py-3 shadow-md backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={active ? activeRef : undefined}
            onClick={() => onSelect(tab.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
              active ? "bg-white text-gray-900 shadow" : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.name}
          </button>
        );
      })}
    </nav>
  );
}
