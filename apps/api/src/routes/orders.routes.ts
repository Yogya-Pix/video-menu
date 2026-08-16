import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { HttpError } from "../middleware/errorHandler";
import { updateOrderStatusSchema } from "../validators/orders.validators";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

const VALID_STATUSES = ["PENDING", "COMPLETED", "CANCELLED"] as const;

ordersRouter.get("/", async (req, res) => {
  const statusParam = req.query.status;
  const status = VALID_STATUSES.find((s) => s === statusParam);

  const orders = await prisma.order.findMany({
    where: {
      restaurantId: req.user!.restaurantId,
      ...(status ? { status } : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({ orders });
});

ordersRouter.patch("/:id", async (req, res) => {
  const { status } = updateOrderStatusSchema.parse(req.body);

  const existing = await prisma.order.findFirst({
    where: { id: req.params.id, restaurantId: req.user!.restaurantId },
  });
  if (!existing) throw new HttpError(404, "Order not found");

  const order = await prisma.order.update({
    where: { id: existing.id },
    data: { status },
    include: { items: true },
  });

  res.json({ order });
});
