import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { HttpError } from "../middleware/errorHandler";
import { createPresignedUploadUrl } from "../lib/s3";
import { presignUploadSchema, assertContentTypeAllowed } from "../validators/uploads.validators";

export const uploadsRouter = Router();

uploadsRouter.use(requireAuth);

uploadsRouter.post("/presign", async (req, res) => {
  const { itemId, kind, contentType } = presignUploadSchema.parse(req.body);

  if (!assertContentTypeAllowed(kind, contentType)) {
    throw new HttpError(400, `Content type ${contentType} not allowed for ${kind}`);
  }

  // Ownership check: the item must belong to the authenticated user's own restaurant.
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId: req.user!.restaurantId },
  });
  if (!item) {
    throw new HttpError(404, "Menu item not found");
  }

  // Each upload gets a unique key (rather than a fixed "video.mp4" path) so
  // replacing a video/thumbnail is a new URL, not a stale one — CloudFront's
  // cache key ignores query strings, so a fixed path would keep serving the
  // previous file until the CDN cache naturally expired.
  const extension = contentType.split("/")[1] ?? "bin";
  const filename = kind === "video" ? `video-${Date.now()}.${extension}` : `thumbnail-${Date.now()}.${extension}`;
  const key = `restaurants/${req.user!.restaurantId}/items/${itemId}/${filename}`;

  const { uploadUrl } = await createPresignedUploadUrl({ key, contentType });

  res.json({ uploadUrl, key });
});
