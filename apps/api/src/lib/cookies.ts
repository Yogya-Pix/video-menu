import type { Response } from "express";
import { env } from "./env";

export const SESSION_COOKIE = "videomenu_session";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.cookieCrossSite || env.nodeEnv === "production",
    sameSite: env.cookieCrossSite ? "none" : "lax",
    maxAge: SEVEN_DAYS_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: env.cookieCrossSite || env.nodeEnv === "production",
    sameSite: env.cookieCrossSite ? "none" : "lax",
    path: "/",
  });
}
