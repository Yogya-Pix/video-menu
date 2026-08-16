"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { putFileWithProgress } from "@/lib/upload";
import type { DishVideo, MenuItem } from "@/lib/types";

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEOS = 8;

async function presignAndUpload(
  itemId: string,
  kind: "video" | "thumbnail",
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>("/api/uploads/presign", {
    itemId,
    kind,
    contentType: file.type,
  });
  await putFileWithProgress(uploadUrl, file, onProgress);
  return key;
}

function VideoSlot({
  itemId,
  video,
  onUpdated,
}: {
  itemId: string;
  video: DishVideo;
  onUpdated: (item: MenuItem) => void;
}) {
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [thumbProgress, setThumbProgress] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(`Unsupported file type. Use ${ALLOWED_IMAGE_TYPES.join(", ")}.`);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`File is too large. Max ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))}MB.`);
      return;
    }

    setThumbProgress(0);
    try {
      const key = await presignAndUpload(itemId, "thumbnail", file, setThumbProgress);
      const { item } = await api.patch<{ item: MenuItem }>(`/api/menu/items/${itemId}/videos/${video.id}`, {
        thumbnailKey: key,
      });
      onUpdated(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setThumbProgress(null);
      if (thumbInputRef.current) thumbInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!confirm("Remove this video?")) return;
    setError(null);
    setRemoving(true);
    try {
      const { item } = await api.delete<{ item: MenuItem }>(`/api/menu/items/${itemId}/videos/${video.id}`);
      onUpdated(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove it");
      setRemoving(false);
    }
  }

  return (
    <div className="flex gap-3 rounded-xl border border-gray-200 p-3">
      <video src={video.videoUrl} controls className="aspect-[4/5] w-28 shrink-0 rounded-lg bg-black object-cover" />

      <div className="flex flex-1 flex-col gap-2">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnailUrl} alt="Thumbnail" className="h-16 w-16 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-[10px] text-gray-400">
            No thumbnail
          </div>
        )}

        <input
          ref={thumbInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleThumbnailChange}
          disabled={thumbProgress !== null || removing}
          className="text-xs text-gray-600"
        />

        {thumbProgress !== null && (
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${thumbProgress}%` }} />
          </div>
        )}

        <button
          onClick={handleRemove}
          disabled={removing}
          className="self-start text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
        >
          {removing ? "Removing..." : "Remove video"}
        </button>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export function DishVideoManager({
  itemId,
  videos,
  onUpdated,
}: {
  itemId: string;
  videos: DishVideo[];
  onUpdated: (item: MenuItem) => void;
}) {
  const addInputRef = useRef<HTMLInputElement>(null);
  const [addProgress, setAddProgress] = useState<number | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleAddVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAddError(null);

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setAddError(`Unsupported file type. Use ${ALLOWED_VIDEO_TYPES.join(", ")}.`);
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setAddError(`File is too large. Max ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))}MB.`);
      return;
    }

    setAddProgress(0);
    try {
      const key = await presignAndUpload(itemId, "video", file, setAddProgress);
      const { item } = await api.post<{ item: MenuItem }>(`/api/menu/items/${itemId}/videos`, { videoKey: key });
      onUpdated(item);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAddProgress(null);
      if (addInputRef.current) addInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {videos.map((video) => (
        <VideoSlot key={video.id} itemId={itemId} video={video} onUpdated={onUpdated} />
      ))}

      {videos.length === 0 && <p className="text-sm text-gray-400">No videos yet.</p>}

      {videos.length < MAX_VIDEOS ? (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-gray-300 p-3">
          <label className="text-sm font-medium text-gray-700">
            {videos.length === 0 ? "Add a video" : "Add another video"}
          </label>
          <input
            ref={addInputRef}
            type="file"
            accept={ALLOWED_VIDEO_TYPES.join(",")}
            onChange={handleAddVideo}
            disabled={addProgress !== null}
            className="text-xs text-gray-600"
          />
          {addProgress !== null && (
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full bg-brand-600 transition-all" style={{ width: `${addProgress}%` }} />
            </div>
          )}
          {addError && <p className="text-xs text-red-600">{addError}</p>}
        </div>
      ) : (
        <p className="text-xs text-gray-400">Maximum of {MAX_VIDEOS} videos per dish.</p>
      )}
    </div>
  );
}
