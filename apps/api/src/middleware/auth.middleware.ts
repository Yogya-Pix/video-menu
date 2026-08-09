import type { NextFunction, Request, Response } from "express";
import { verifySession, type SessionPayload } from "../lib/jwt";
import { SESSION_COOKIE } from "../lib/cookies";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    req.user = verifySession(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
