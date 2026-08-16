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
  attachVideoSchema,
  attachThumbnailSchema,
} from "../validators/menu.validators";

export const menuRouter = Router();

menuRouter.use(requireAuth);

function serializeItem(item: {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  categoryId: string | null;
  isAvailable: boolean;
  sortOrder: number;
  videoKey: string | null;
  videoStatus: string;
  thumbnailKey: string | null;
}) {
  return {
    ...item,
    videoUrl: item.videoKey ? cdnUrlForKey(item.videoKey) : null,
    thumbnailUrl: item.thumbnailKey ? cdnUrlForKey(item.thumbnailKey) : null,
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
  });
  res.json({ items: items.map(serializeItem) });
});

menuRouter.get("/items/:id", async (req, res) => {
  const item = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
  });
  if (!item) throw new HttpError(404, "Menu item not found");
  res.json({ item: serializeItem(item) });
});

menuRouter.post("/items", async (req, res) => {
  const data = createMenuItemSchema.parse(req.body);
  const item = await prisma.menuItem.create({
    data: { ...data, restaurantId: req.user!.restaurantId },
  });
  res.status(201).json({ item: serializeItem(item) });
});

menuRouter.patch("/items/:id", async (req, res) => {
  const data = updateMenuItemSchema.parse(req.body);

  const existing = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
  });
  if (!existing) throw new HttpError(404, "Menu item not found");

  const item = await prisma.menuItem.update({ where: { id: existing.id }, data });
  res.json({ item: serializeItem(item) });
});

menuRouter.delete("/items/:id", async (req, res) => {
  const existing = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
  });
  if (!existing) throw new HttpError(404, "Menu item not found");

  await prisma.menuItem.delete({ where: { id: existing.id } });
  res.status(204).end();
});

menuRouter.patch("/items/:id/video", async (req, res) => {
  const { videoKey } = attachVideoSchema.parse(req.body);

  const existing = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
  });
  if (!existing) throw new HttpError(404, "Menu item not found");

  const item = await prisma.menuItem.update({
    where: { id: existing.id },
    data: { videoKey, videoStatus: "READY" },
  });

  if (existing.videoKey && existing.videoKey !== videoKey) {
    deleteObject(existing.videoKey).catch(() => {});
  }

  res.json({ item: serializeItem(item) });
});

menuRouter.patch("/items/:id/thumbnail", async (req, res) => {
  const { thumbnailKey } = attachThumbnailSchema.parse(req.body);

  const existing = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
  });
  if (!existing) throw new HttpError(404, "Menu item not found");

  const item = await prisma.menuItem.update({
    where: { id: existing.id },
    data: { thumbnailKey },
  });

  if (existing.thumbnailKey && existing.thumbnailKey !== thumbnailKey) {
    deleteObject(existing.thumbnailKey).catch(() => {});
  }

  res.json({ item: serializeItem(item) });
});

menuRouter.delete("/items/:id/video", async (req, res) => {
  const existing = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
  });
  if (!existing) throw new HttpError(404, "Menu item not found");

  if (existing.videoKey) {
    await deleteObject(existing.videoKey);
  }

  const item = await prisma.menuItem.update({
    where: { id: existing.id },
    data: { videoKey: null, videoStatus: "PENDING" },
  });
  res.json({ item: serializeItem(item) });
});

menuRouter.delete("/items/:id/thumbnail", async (req, res) => {
  const existing = await prisma.menuItem.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
  });
  if (!existing) throw new HttpError(404, "Menu item not found");

  if (existing.thumbnailKey) {
    await deleteObject(existing.thumbnailKey);
  }

  const item = await prisma.menuItem.update({
    where: { id: existing.id },
    data: { thumbnailKey: null },
  });
  res.json({ item: serializeItem(item) });
});
