import rateLimit from "express-rate-limit";

export const globalAiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  keyGenerator: () => "gemini-global",
  standardHeaders: "draft-8",
  legacyHeaders: false,
});