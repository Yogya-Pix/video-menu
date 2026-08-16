import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { generateAndUploadQrCode } from "../lib/qrcode";
import { cdnUrlForKey, deleteObject } from "../lib/s3";
import { env } from "../lib/env";
import { HttpError } from "../middleware/errorHandler";

export const qrRouter = Router();

qrRouter.use(requireAuth);

// Returns the cached QR code if one exists, generating it on first request.
qrRouter.get("/", async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.user!.restaurantId },
  });
  if (!restaurant) throw new HttpError(404, "Restaurant not found");

  const menuUrl = `${env.webPublicUrl}/menu/${restaurant.slug}`;

  if (restaurant.qrCodeKey) {
    return res.json({ qrCodeUrl: cdnUrlForKey(restaurant.qrCodeKey), menuUrl });
  }

  const { key, url } = await generateAndUploadQrCode({ restaurantId: restaurant.id, targetUrl: menuUrl });

  await prisma.restaurant.update({ where: { id: restaurant.id }, data: { qrCodeKey: key } });

  res.json({ qrCodeUrl: url, menuUrl });
});

// Force-regenerate, e.g. after the restaurant slug changes.
qrRouter.post("/regenerate", async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.user!.restaurantId },
  });
  if (!restaurant) throw new HttpError(404, "Restaurant not found");

  const menuUrl = `${env.webPublicUrl}/menu/${restaurant.slug}`;
  const { key, url } = await generateAndUploadQrCode({ restaurantId: restaurant.id, targetUrl: menuUrl });

  await prisma.restaurant.update({ where: { id: restaurant.id }, data: { qrCodeKey: key } });

  if (restaurant.qrCodeKey && restaurant.qrCodeKey !== key) {
    deleteObject(restaurant.qrCodeKey).catch(() => {});
  }

  res.json({ qrCodeUrl: url, menuUrl });
});
