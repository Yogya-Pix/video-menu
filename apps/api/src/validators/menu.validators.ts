import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(80),
  sortOrder: z.number().int().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createMenuItemSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  priceCents: z.number().int().nonnegative(),
  categoryId: z.string().optional().nullable(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const addVideoSchema = z.object({
  videoKey: z.string().min(1),
});

export const attachVideoThumbnailSchema = z.object({
  thumbnailKey: z.string().min(1),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
});
