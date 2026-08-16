import { z } from "zod";

export const createOrderSchema = z.object({
  tableLabel: z.string().max(40).optional(),
  notes: z.string().max(300).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(50),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["COMPLETED", "CANCELLED"]),
});
