import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { router } from "./routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "..", "..", "frontend");

/**
 * App Express: API em `/api`, frontend estático (HTML/CSS/JS) na raiz.
 */
export const app = express();

app.set("trust proxy", env.nodeEnv === "production" ? 1 : false);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
      },
    },
  }),
);

app.use(
  cors({
    origin:
      env.corsOrigins.length > 0
        ? env.corsOrigins
        : env.nodeEnv === "production"
          ? false
          : true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use("/api", router);

app.get("/favicon.ico", (req, res) => {
  res.redirect(308, "/favicon.svg");
});

app.get(["/0", "/admin/0"], (req, res) => {
  res.status(204).send();
});

app.use(
  express.static(frontendDir, {
    index: ["index.html"],
    maxAge: env.nodeEnv === "production" ? "1d" : 0,
  }),
);

app.use(errorHandler);
