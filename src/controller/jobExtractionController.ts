import type { Request, Response } from "express";
import { extractJobDescription } from "../services/jobExtractionService.js";
import { AppError } from "../middleware/errorHandler.js";
import { createJobExtractionValidator } from "../validators/jobExtractionValidator.js";

export const extractJobController = async (
  req: Request,
  res: Response
) => {
  const validator = createJobExtractionValidator.safeParse(req.body)

  if (
    !validator.success
  ) {
    throw new AppError("Invalid job description", 400);
  }

  const draft = await extractJobDescription(validator.data.rawDescription);

  res.status(200).json({ message: 'success', data: draft });
};