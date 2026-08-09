import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { HttpError } from "../middleware/errorHandler";
import { updateRestaurantSchema } from "../validators/menu.validators";
import { cdnUrlForKey } from "../lib/s3";

export const restaurantRouter = Router();

restaurantRouter.use(requireAuth);

restaurantRouter.get("/me", async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.user!.restaurantId },
  });
  if (!restaurant) throw new HttpError(404, "Restaurant not found");

  res.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      logoUrl: restaurant.logoKey ? cdnUrlForKey(restaurant.logoKey) : null,
    },
  });
});

restaurantRouter.patch("/me", async (req, res) => {
  const data = updateRestaurantSchema.parse(req.body);

  const restaurant = await prisma.restaurant.update({
    where: { id: req.user!.restaurantId },
    data,
  });

  res.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
    },
  });
});
