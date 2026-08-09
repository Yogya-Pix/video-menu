"use client";

import { useEffect, useRef, useState } from "react";

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  label,
}: {
  videoUrl: string | null;
  thumbnailUrl: string | null;
  label: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // autoplay can be blocked before user interaction; ignore
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  if (!videoUrl) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400">
        Video coming soon
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl ?? undefined}
        className="h-full w-full object-cover"
        playsInline
        muted={muted}
        loop
        preload="metadata"
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur"
      >
        {muted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
}
