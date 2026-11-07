import { crossRoleSkillsGap } from "../services/crossRoleSkillsGapServices.js"
import type { Request, Response } from "express"

export const getCrossRoleSkillsGap = async (req: Request, res: Response) => {
    const result = await crossRoleSkillsGap(req.userId)

    return res.status(200).send({ message: 'success', data: result})
}