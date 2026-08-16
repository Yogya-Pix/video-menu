import { Router } from "express";
import { prisma } from "../lib/prisma";
import { cdnUrlForKey, deleteObject } from "../lib/s3";
import { requireAuth } from "../middleware/auth.middleware";
import { HttpError } from "../middleware/errorHandler";
import {
  createCategorySchema,
  updateCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  addVideoSchema,
  attachVideoThumbnailSchema,
} from "../validators/menu.validators";

export const menuRouter = Router();

menuRouter.use(requireAuth);

const MAX_VIDEOS_PER_ITEM = 8;

const ITEM_WITH_VIDEOS = {
  videos: { orderBy: { sortOrder: "asc" as const } },
};

function serializeItem(item: {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  categoryId: string | null;
  isAvailable: boolean;
  sortOrder: number;
  videos: { id: string; videoKey: string; thumbnailKey: string | null }[];
}) {
  return {
    ...item,
    videos: item.videos.map((v) => ({
      id: v.id,
      videoUrl: cdnUrlForKey(v.videoKey),
      thumbnailUrl: v.thumbnailKey ? cdnUrlForKey(v.thumbnailKey) : null,
    })),
  };
}

// ---- Categories ----

menuRouter.get("/categories", async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { restaurantId: req.user!.restaurantId },
    orderBy: { sortOrder: "asc" },
  });
  res.json({ categories });
});

menuRouter.post("/categories", async (req, res) => {
  const data = createCategorySchema.parse(req.body);
  const category = await prisma.category.create({
    data: { ...data, restaurantId: req.user!.restaurantId },
  });
  res.status(201).json({ category });
});

menuRouter.patch("/categories/:id", async (req, res) => {
  const data = updateCategorySchema.parse(req.body);

  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
  });
  if (!existing) throw new HttpError(404, "Category not found");

  const category = await prisma.category.update({ where: { id: existing.id }, data });
  res.json({ category });
});

menuRouter.delete("/categories/:id", async (req, res) => {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
  });
  if (!existing) throw new HttpError(404, "Category not found");

  await prisma.category.delete({ where: { id: existing.id } });
  res.status(204).end();
});

// ---- Menu items ----

menuRouter.get("/items", async (req, res) => {
  const items = await prisma.menuItem.findMany({
    where: { restaurantId: req.user!.restaurantId },
    orderBy: { sortOrder: "asc" },
    include: ITEM_WITH_VIDEOS,
  });
  res.json({ items: items.map(serializeItem) });
});

menuRouter.get("/items/:id", async (req, res) => {
  const item = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
    include: ITEM_WITH_VIDEOS,
  });
  if (!item) throw new HttpError(404, "Menu item not found");
  res.json({ item: serializeItem(item) });
});

menuRouter.post("/items", async (req, res) => {
  const data = createMenuItemSchema.parse(req.body);
  const item = await prisma.menuItem.create({
    data: { ...data, restaurantId: req.user!.restaurantId },
    include: ITEM_WITH_VIDEOS,
  });
  res.status(201).json({ item: serializeItem(item) });
});

menuRouter.patch("/items/:id", async (req, res) => {
  const data = updateMenuItemSchema.parse(req.body);

  const existing = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
  });
  if (!existing) throw new HttpError(404, "Menu item not found");

  const item = await prisma.menuItem.update({
    where: { id: existing.id },
    data,
    include: ITEM_WITH_VIDEOS,
  });
  res.json({ item: serializeItem(item) });
});

menuRouter.delete("/items/:id", async (req, res) => {
  const existing = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
    include: ITEM_WITH_VIDEOS,
  });
  if (!existing) throw new HttpError(404, "Menu item not found");

  await prisma.menuItem.delete({ where: { id: existing.id } });

  for (const video of existing.videos) {
    deleteObject(video.videoKey).catch(() => {});
    if (video.thumbnailKey) deleteObject(video.thumbnailKey).catch(() => {});
  }

  res.status(204).end();
});

// ---- Dish videos ----

menuRouter.post("/items/:id/videos", async (req, res) => {
  const { videoKey } = addVideoSchema.parse(req.body);

  const existing = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
    include: ITEM_WITH_VIDEOS,
  });
  if (!existing) throw new HttpError(404, "Menu item not found");

  if (existing.videos.length >= MAX_VIDEOS_PER_ITEM) {
    throw new HttpError(400, `A dish can have at most ${MAX_VIDEOS_PER_ITEM} videos`);
  }

  const nextSortOrder = existing.videos.reduce((max, v) => Math.max(max, v.sortOrder), -1) + 1;

  await prisma.dishVideo.create({
    data: { menuItemId: existing.id, videoKey, sortOrder: nextSortOrder },
  });

  const item = await prisma.menuItem.findUniqueOrThrow({
    where: { id: existing.id },
    include: ITEM_WITH_VIDEOS,
  });
  res.status(201).json({ item: serializeItem(item) });
});

menuRouter.patch("/items/:id/videos/:videoId", async (req, res) => {
  const { thumbnailKey } = attachVideoThumbnailSchema.parse(req.body);

  const video = await prisma.dishVideo.findFirst({
    where: {
      id: req.params.videoId,
      menuItemId: req.params.id,
      menuItem: { restaurantId: req.user!.restaurantId },
    },
  });
  if (!video) throw new HttpError(404, "Video not found");

  await prisma.dishVideo.update({ where: { id: video.id }, data: { thumbnailKey } });

  if (video.thumbnailKey && video.thumbnailKey !== thumbnailKey) {
    deleteObject(video.thumbnailKey).catch(() => {});
  }

  const item = await prisma.menuItem.findUniqueOrThrow({
    where: { id: req.params.id },
    include: ITEM_WITH_VIDEOS,
  });
  res.json({ item: serializeItem(item) });
});

menuRouter.delete("/items/:id/videos/:videoId", async (req, res) => {
  const video = await prisma.dishVideo.findFirst({
    where: {
      id: req.params.videoId,
      menuItemId: req.params.id,
      menuItem: { restaurantId: req.user!.restaurantId },
    },
  });
  if (!video) throw new HttpError(404, "Video not found");

  await prisma.dishVideo.delete({ where: { id: video.id } });

  deleteObject(video.videoKey).catch(() => {});
  if (video.thumbnailKey) deleteObject(video.thumbnailKey).catch(() => {});

  const item = await prisma.menuItem.findUniqueOrThrow({
    where: { id: req.params.id },
    include: ITEM_WITH_VIDEOS,
  });
  res.json({ item: serializeItem(item) });
});
