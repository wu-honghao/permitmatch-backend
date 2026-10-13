import type { Request, Response } from "express"
import { getProfileService, updateProfileService } from "../services/profileServices.js"
import mongoose from "mongoose"
import { profileSchema } from "../validators/profileValidator.js"

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
    const result = profileSchema.safeParse(req.body)

    if(!result.success){
        return res.status(400).send({
            message: 'Invalid body',
        })
    }

    const { data } = result
    const profile = await updateProfileService(req.userId, data)
    if(!profile){
        return res.status(404).send({
            message: 'Invalid userId or profile'
        })
    }

    return res.status(200).send({
        message: 'success',
        data: profile
    })
}