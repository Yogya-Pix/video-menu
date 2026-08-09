import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { signSession } from "../lib/jwt";
import { setSessionCookie, clearSessionCookie } from "../lib/cookies";
import { requireAuth } from "../middleware/auth.middleware";
import { loginSchema } from "../validators/auth.validators";
import { HttpError } from "../middleware/errorHandler";

export const authRouter = Router();

// Only login is rate-limited — it's the brute-force target. /me and /logout
// are called on every page load and shouldn't throttle legitimate sessions.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { restaurant: true },
  });

  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = signSession({
    userId: user.id,
    restaurantId: user.restaurantId,
    role: user.role,
  });

  setSessionCookie(res, token);

  res.json({
    user: { id: user.id, email: user.email, role: user.role },
    restaurant: { id: user.restaurant.id, name: user.restaurant.name, slug: user.restaurant.slug },
  });
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { restaurant: true },
  });

  if (!user) {
    throw new HttpError(401, "Session no longer valid");
  }

  res.json({
    user: { id: user.id, email: user.email, role: user.role },
    restaurant: { id: user.restaurant.id, name: user.restaurant.name, slug: user.restaurant.slug },
  });
});
