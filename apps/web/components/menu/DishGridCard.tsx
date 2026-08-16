"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicMenuItem } from "@/lib/types";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// How long to hold on the thumbnail before switching to the video, when a
// thumbnail exists. If there's no thumbnail, the video starts right away.
const THUMBNAIL_HOLD_MS = 1800;

export function DishGridCard({ item, onOpen }: { item: PublicMenuItem; onOpen: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playVideo, setPlayVideo] = useState(false);

  useEffect(() => {
    if (!item.videoUrl) return;
    const container = containerRef.current;
    if (!container) return;

    let holdTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (item.thumbnailUrl) {
            holdTimer = setTimeout(() => setPlayVideo(true), THUMBNAIL_HOLD_MS);
          } else {
            setPlayVideo(true);
          }
        } else {
          if (holdTimer) clearTimeout(holdTimer);
          setPlayVideo(false);
          videoRef.current?.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [item.videoUrl, item.thumbnailUrl]);

  useEffect(() => {
    if (playVideo) {
      videoRef.current?.play().catch(() => {
        // autoplay can be blocked before user interaction; ignore
      });
    }
  }, [playVideo]);

  const showVideo = Boolean(item.videoUrl) && playVideo;

  return (
    <button
      onClick={onOpen}
      className="group flex flex-col gap-2 text-left transition-transform active:scale-[0.97]"
    >
      <div
        ref={containerRef}
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm"
      >
        {showVideo ? (
          <video
            ref={videoRef}
            src={item.videoUrl!}
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-active:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-gray-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 5h16v14H4V5Zm0 10 4.5-4.5a1 1 0 0 1 1.4 0L14 14.5m0 0 1.6-1.6a1 1 0 0 1 1.4 0L20 15.5M9 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
              />
            </svg>
            <span className="text-[11px] font-medium text-gray-300">No photo yet</span>
          </div>
        )}
        {item.videoUrl && !showVideo && (
          <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white shadow-sm backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}
      </div>
      <div>
        <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
        <p className="text-sm font-medium text-brand-600">{formatPrice(item.priceCents)}</p>
      </div>
    </button>
  );
}
