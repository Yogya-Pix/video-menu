import { z } from "zod";

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const presignUploadSchema = z.object({
  itemId: z.string().min(1),
  kind: z.enum(["video", "thumbnail"]),
  contentType: z.string(),
});

export function assertContentTypeAllowed(kind: "video" | "thumbnail", contentType: string) {
  const allowed = kind === "video" ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
  return (allowed as readonly string[]).includes(contentType);
}

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB, enforced client-side + noted for future S3 policy tightening
