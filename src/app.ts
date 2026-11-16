import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import userRouter from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import jobRoutes from "./routes/jobRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import crossRoleSkillsGapRoutes from "./routes/crossRoleSkillsGap.js";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";
import pino from "pino";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "100kb" }));

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN
}));

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["req.headers.authorization", "req.headers.cookie"],
});

app.use(
  pinoHttp({
    logger,
    genReqId: () => randomUUID(),

    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url?.split("?")[0],
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  })
);

app.use("/auth", userRouter);
app.use("/profile", authMiddleware, profileRoutes);
app.use("/jobs", authMiddleware, jobRoutes);
app.use("/analyses", authMiddleware, analysisRoutes);
app.use("/skillsGap", authMiddleware, crossRoleSkillsGapRoutes);

app.use(errorHandler);

export default app;