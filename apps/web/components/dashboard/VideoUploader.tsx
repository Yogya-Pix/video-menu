"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { putFileWithProgress } from "@/lib/upload";
import type { MenuItem } from "@/lib/types";

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function VideoUploader({
  itemId,
  kind,
  currentUrl,
  onUploaded,
}: {
  itemId: string;
  kind: "video" | "thumbnail";
  currentUrl: string | null;
  onUploaded: (item: MenuItem) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const allowedTypes = kind === "video" ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
  const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!allowedTypes.includes(file.type)) {
      setError(`Unsupported file type. Use ${allowedTypes.join(", ")}.`);
      return;
    }
    if (file.size > maxBytes) {
      setError(`File is too large. Max ${Math.round(maxBytes / (1024 * 1024))}MB.`);
      return;
    }

    setProgress(0);
    try {
      const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>("/api/uploads/presign", {
        itemId,
        kind,
        contentType: file.type,
      });

      await putFileWithProgress(uploadUrl, file, setProgress);

      const path = kind === "video" ? `/api/menu/items/${itemId}/video` : `/api/menu/items/${itemId}/thumbnail`;
      const body = kind === "video" ? { videoKey: key } : { thumbnailKey: key };
      const { item } = await api.patch<{ item: MenuItem }>(path, body);

      onUploaded(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove the ${kind === "video" ? "video" : "thumbnail"}?`)) return;
    setError(null);
    setRemoving(true);
    try {
      const path = kind === "video" ? `/api/menu/items/${itemId}/video` : `/api/menu/items/${itemId}/thumbnail`;
      const { item } = await api.delete<{ item: MenuItem }>(path);
      onUploaded(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove it");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {kind === "video" ? (
        currentUrl ? (
          <video src={currentUrl} controls className="aspect-[4/5] w-40 rounded-xl bg-black object-cover" />
        ) : (
          <div className="flex aspect-[4/5] w-40 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400">
            No video yet
          </div>
        )
      ) : currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentUrl} alt="Thumbnail" className="aspect-[4/5] w-40 rounded-xl object-cover" />
      ) : (
        <div className="flex aspect-[4/5] w-40 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400">
          No thumbnail
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={allowedTypes.join(",")}
        onChange={handleFileChange}
        disabled={progress !== null || removing}
        className="text-xs text-gray-600"
      />

      {currentUrl && (
        <button
          onClick={handleRemove}
          disabled={progress !== null || removing}
          className="self-start text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
        >
          {removing ? "Removing..." : `Remove ${kind === "video" ? "video" : "thumbnail"}`}
        </button>
      )}

      {progress !== null && (
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && <p className="max-w-40 text-xs text-red-600">{error}</p>}
    </div>
  );
}
