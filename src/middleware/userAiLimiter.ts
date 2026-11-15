import { rateLimit } from "express-rate-limit";

export const userAiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  keyGenerator: (req) => req.userId!,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "AI request limit exceeded. Try again later."
  },
});