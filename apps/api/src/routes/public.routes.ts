import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { cdnUrlForKey } from "../lib/s3";
import { HttpError } from "../middleware/errorHandler";
import { createOrderSchema } from "../validators/orders.validators";

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
        include: { videos: { orderBy: { sortOrder: "asc" } } },
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
      videos: item.videos.map((v) => ({
        id: v.id,
        videoUrl: cdnUrlForKey(v.videoKey),
        thumbnailUrl: v.thumbnailKey ? cdnUrlForKey(v.thumbnailKey) : null,
      })),
    })),
  });
});

// Diners are never authenticated, so this endpoint is rate-limited instead
// to blunt spam/abuse, separate from the login limiter.
const createOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// No auth — a diner submits this straight from the public menu page.
publicRouter.post("/menu/:slug/orders", createOrderLimiter, async (req, res) => {
  const { tableLabel, notes, items } = createOrderSchema.parse(req.body);

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: req.params.slug },
  });
  if (!restaurant) {
    throw new HttpError(404, "Menu not found");
  }

  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, restaurantId: restaurant.id, isAvailable: true },
  });

  if (menuItems.length !== new Set(menuItemIds).size) {
    throw new HttpError(400, "One or more items in your order are no longer available");
  }

  const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

  // Price/name are always taken from the current MenuItem row on the server —
  // the client never gets to supply a price.
  const orderItemsData = items.map(({ menuItemId, quantity }) => {
    const menuItem = menuItemsById.get(menuItemId)!;
    return {
      menuItemId: menuItem.id,
      quantity,
      nameSnapshot: menuItem.name,
      priceCentsSnapshot: menuItem.priceCents,
    };
  });

  const totalCents = orderItemsData.reduce((sum, item) => sum + item.priceCentsSnapshot * item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      tableLabel,
      notes,
      totalCents,
      items: { create: orderItemsData },
    },
  });

  res.status(201).json({ orderId: order.id, status: order.status, totalCents: order.totalCents });
});
