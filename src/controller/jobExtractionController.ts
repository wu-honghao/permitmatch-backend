import type { Request, Response } from "express";
import { extractJobDescription } from "../services/jobExtractionService.js";
import { AppError } from "../middleware/errorHandler.js";

export const extractJobController = async (
  req: Request,
  res: Response
) => {
  const { rawDescription } = req.body ?? {};

  if (
    typeof rawDescription !== "string" ||
    rawDescription.trim().length < 30 ||
    rawDescription.length > 20000
  ) {
    throw new AppError("Invalid job description", 400);
  }

  const draft = await extractJobDescription(rawDescription);

  res.status(200).json({ message: 'success', data: draft });
};