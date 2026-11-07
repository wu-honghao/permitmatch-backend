import { AppError } from "../middleware/errorHandler.js";
import { crossRoleSkillsGap } from "../services/crossRoleSkillsGapServices.js"
import type { Request, Response } from "express"

export const getCrossRoleSkillsGap = async (
    req: Request,
    res: Response
) => {
    const userId = req.userId;

    if (!userId) {
        throw new AppError("Unauthorized", 401);
    }

    const result = await crossRoleSkillsGap(userId);

    return res.status(200).json({
        message: "success",
        data: result
    });
};