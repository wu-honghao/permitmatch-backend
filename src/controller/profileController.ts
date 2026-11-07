import type { Request, Response } from "express"
import { getProfileService, updateProfileService } from "../services/profileServices.js"
import mongoose from "mongoose"
import { profileSchema } from "../validators/profileValidator.js"
import { AppError } from "../middleware/errorHandler.js"

export const getProfile = async (req: Request, res: Response) => {
    if(!mongoose.isObjectIdOrHexString(req.userId) || req.userId === undefined){
        return res.status(400).send({
            message: 'Invalid UserId'
        })
    }

    const result = await getProfileService(req.userId)

    return res.status(200).send({
        message: 'success',
        data: result
    })
}

export const updateProfile = async (req: Request, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        throw new AppError("Unauthorized", 401);
    }

    const result = profileSchema.safeParse(req.body);

    if (!result.success) {
        throw new AppError("Invalid body", 400);
    }

    const { data } = result;

    const profile = await updateProfileService(userId, data);

    if (!profile) {
        throw new AppError("Invalid userId or profile", 404);
    }

    return res.status(200).json({
        message: "success",
        data: profile
    });
};