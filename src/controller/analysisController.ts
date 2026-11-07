import type { Request, Response } from "express"
import { getAnalysesList, getAnalysisById } from "../services/analysisServices.js"
import { AppError } from "../middleware/errorHandler.js";

export const getAnalysisByIdController = async (
    req: Request,
    res: Response
) => {
    const userId = req.userId;
    const id = req.params.id;

    if (!userId) {
        throw new AppError("Unauthorized", 401);
    }

    if (typeof id !== "string") {
        throw new AppError("Invalid analysis ID", 400);
    }

    const result = await getAnalysisById(userId, id);

    return res.status(200).json({
        message: "success",
        data: result
    });
};

export const getAnalysesListController = async (
    req: Request,
    res: Response
) => {
    const userId = req.userId;

    if (!userId) {
        throw new AppError("Unauthorized", 401);
    }

    const result = await getAnalysesList(userId);

    return res.status(200).json({
        message: "success",
        data: result
    });
};