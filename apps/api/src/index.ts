import "dotenv/config";
import "express-async-errors";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import { env } from "./lib/env";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { publicRouter } from "./routes/public.routes";
import { menuRouter } from "./routes/menu.routes";
import { uploadsRouter } from "./routes/uploads.routes";
import { qrRouter } from "./routes/qr.routes";
import { restaurantRouter } from "./routes/restaurant.routes";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);
app.use("/api/menu", menuRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/qrcode", qrRouter);
app.use("/api/restaurant", restaurantRouter);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
