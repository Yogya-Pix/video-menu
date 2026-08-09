import jwt from "jsonwebtoken";
import { env } from "./env";

export interface SessionPayload {
  userId: string;
  restaurantId: string;
  role: "OWNER" | "STAFF";
}

const EXPIRES_IN = "7d";

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, env.jwtSecret) as SessionPayload;
}
