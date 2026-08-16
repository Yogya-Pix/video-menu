"use client";

import { useEffect, useRef, useState } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useCart } from "@/lib/cart-context";
import type { PublicMenuItem } from "@/lib/types";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const EXIT_DURATION_MS = 200;

export function DishModal({ item, onClose }: { item: PublicMenuItem; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  const slides = item.videos.length > 0 ? item.videos : [null];

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, EXIT_DURATION_MS);
  }

  function handleAddToCart() {
    addItem(item, quantity);
    handleClose();
  }

  function handleCarouselScroll() {
    const el = carouselRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveSlide(Math.round(el.scrollLeft / el.clientWidth));
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-20 flex items-end justify-center transition-colors duration-200 sm:items-center sm:px-4 sm:py-8 ${
        visible ? "bg-black/80" : "bg-black/0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`flex max-h-[92vh] w-full max-w-sm flex-col overflow-y-auto rounded-t-3xl bg-white shadow-2xl transition-transform duration-200 ease-out sm:rounded-2xl ${
          visible ? "translate-y-0" : "translate-y-full sm:translate-y-6 sm:opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pb-1 pt-2.5 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="relative">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {slides.map((video, idx) => (
              <div key={video?.id ?? "empty"} className="w-full shrink-0 snap-center">
                <VideoPlayer
                  videoUrl={video?.videoUrl ?? null}
                  thumbnailUrl={video?.thumbnailUrl ?? null}
                  label={slides.length > 1 ? `${item.name} — video ${idx + 1}` : item.name}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white sm:left-3 sm:right-auto"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          {slides.length > 1 && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {slides.map((video, idx) => (
                <span
                  key={video?.id ?? idx}
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
                    idx === activeSlide ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-start justify-between gap-3 p-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
            {item.description && <p className="mt-1 text-sm text-gray-500">{item.description}</p>}
          </div>
          <span className="whitespace-nowrap text-base font-semibold text-brand-600">
            {formatPrice(item.priceCents)}
          </span>
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 p-4">
          <div className="flex shrink-0 items-center gap-3 rounded-full border border-gray-200 px-1 py-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            >
              −
            </button>
            <span className="w-4 text-center text-sm font-semibold text-gray-900">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              aria-label="Increase quantity"
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex-1 rounded-full bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Add to order · {formatPrice(item.priceCents * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}
