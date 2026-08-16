"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicMenuItem } from "@/lib/types";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// How long to hold on the first video's thumbnail before playing starts.
const THUMBNAIL_HOLD_MS = 1800;
// How long each video plays before crossfading to the next one, when a dish
// has more than one video. Subsequent videos skip their own thumbnail pause
// so the cycle keeps flowing rather than stuttering.
const VIDEO_CYCLE_MS = 4000;
const TRANSITION_MS = 700;

export function DishGridCard({ item, onOpen }: { item: PublicMenuItem; onOpen: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  const videos = item.videos;
  const firstThumbnailUrl = videos[0]?.thumbnailUrl ?? null;

  useEffect(() => {
    if (videos.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    let holdTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
          if (firstThumbnailUrl) {
            holdTimer = setTimeout(() => setShowVideo(true), THUMBNAIL_HOLD_MS);
          } else {
            setShowVideo(true);
          }
        } else {
          if (holdTimer) clearTimeout(holdTimer);
          setShowVideo(false);
          setActiveIndex(0);
          videoRefs.current.forEach((v) => v?.pause());
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (holdTimer) clearTimeout(holdTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos.length, firstThumbnailUrl]);

  useEffect(() => {
    if (!showVideo) return;

    videoRefs.current[activeIndex]?.play().catch(() => {
      // autoplay can be blocked before user interaction; ignore
    });

    if (videos.length <= 1) return;

    const cycleTimer = setTimeout(() => {
      videoRefs.current[activeIndex]?.pause();
      setActiveIndex((i) => (i + 1) % videos.length);
    }, VIDEO_CYCLE_MS);

    return () => clearTimeout(cycleTimer);
  }, [showVideo, activeIndex, videos.length]);

  return (
    <button
      onClick={onOpen}
      className="group flex flex-col gap-2 text-left transition-transform active:scale-[0.97]"
    >
      <div
        ref={containerRef}
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm"
      >
        {hasBeenVisible &&
          videos.map((video, idx) => (
            <video
              key={video.id}
              ref={(el) => {
                videoRefs.current[idx] = el;
              }}
              src={video.videoUrl}
              muted
              loop
              playsInline
              preload="metadata"
              style={{ transitionDuration: `${TRANSITION_MS}ms` }}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out ${
                showVideo && idx === activeIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}

        {firstThumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstThumbnailUrl}
            alt={item.name}
            style={{ transitionDuration: `${TRANSITION_MS}ms` }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-in-out group-active:scale-105 ${
              showVideo ? "opacity-0" : "opacity-100"
            }`}
          />
        ) : videos.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-gray-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 5h16v14H4V5Zm0 10 4.5-4.5a1 1 0 0 1 1.4 0L14 14.5m0 0 1.6-1.6a1 1 0 0 1 1.4 0L20 15.5M9 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
              />
            </svg>
            <span className="text-[11px] font-medium text-gray-300">No photo yet</span>
          </div>
        ) : null}

        {videos.length > 0 && (
          <span
            className={`absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white shadow-sm backdrop-blur-sm transition-opacity duration-300 ${
              showVideo ? "opacity-0" : "opacity-100"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}

        {videos.length > 1 && (
          <div className="absolute left-2 top-2 flex gap-1">
            {videos.map((video, idx) => (
              <span
                key={video.id}
                className={`h-1 w-3 rounded-full transition-colors duration-300 ${
                  showVideo && idx === activeIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
        <p className="text-sm font-medium text-brand-600">{formatPrice(item.priceCents)}</p>
      </div>
    </button>
  );
}
