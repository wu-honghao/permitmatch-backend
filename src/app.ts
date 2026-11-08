import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import userRouter from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import jobRoutes from "./routes/jobRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import crossRoleSkillsGapRoutes from "./routes/crossRoleSkillsGap.js";

const app = express();

app.use(express.json());

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN
}));

app.use("/auth", userRouter);
app.use("/profile", authMiddleware, profileRoutes);
app.use("/jobs", authMiddleware, jobRoutes);
app.use("/analyses", authMiddleware, analysisRoutes);
app.use("/skillsGap", authMiddleware, crossRoleSkillsGapRoutes);

app.use(errorHandler);

export default app;