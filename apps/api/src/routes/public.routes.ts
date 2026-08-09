import { Router } from "express";
import { prisma } from "../lib/prisma";
import { cdnUrlForKey } from "../lib/s3";
import { HttpError } from "../middleware/errorHandler";

export const publicRouter = Router();

// No auth — this is what the QR code opens.
publicRouter.get("/menu/:slug", async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: req.params.slug },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      menuItems: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!restaurant) {
    throw new HttpError(404, "Menu not found");
  }

  res.json({
    restaurant: {
      name: restaurant.name,
      description: restaurant.description,
      logoUrl: restaurant.logoKey ? cdnUrlForKey(restaurant.logoKey) : null,
    },
    categories: restaurant.categories.map((c) => ({ id: c.id, name: c.name })),
    items: restaurant.menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      priceCents: item.priceCents,
      categoryId: item.categoryId,
      videoUrl: item.videoStatus === "READY" && item.videoKey ? cdnUrlForKey(item.videoKey) : null,
      thumbnailUrl: item.thumbnailKey ? cdnUrlForKey(item.thumbnailKey) : null,
    })),
  });
});
