import { VideoPlayer } from "./VideoPlayer";
import type { PublicMenuItem } from "@/lib/types";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function DishCard({ item }: { item: PublicMenuItem }) {
  return (
    <article className="flex flex-col gap-3">
      <VideoPlayer videoUrl={item.videoUrl} thumbnailUrl={item.thumbnailUrl} label={item.name} />
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
          {item.description && <p className="mt-0.5 text-sm text-gray-500">{item.description}</p>}
        </div>
        <span className="whitespace-nowrap text-base font-semibold text-brand-600">
          {formatPrice(item.priceCents)}
        </span>
      </div>
    </article>
  );
}
