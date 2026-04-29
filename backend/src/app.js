import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorHandler.js";
import { router } from "./routes/index.js";

/**
 * App principal do Express.
 * Separado do server para facilitar testes e manutenção.
 */
export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", router);

app.use(errorHandler);
