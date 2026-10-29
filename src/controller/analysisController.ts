import type { Request, Response } from "express"
import { getAnalysesList, getAnalysisById } from "../services/analysisServices.js"

export const getAnalysisByIdController = async (req: Request, res: Response) => {
    const result = await getAnalysisById(req.userId, req.params.id)

    return res.status(200).json({
        message: 'success',
        data: result
    })
}

export const getAnalysesListController = async (req: Request, res: Response) => {
    const result = await getAnalysesList(req.userId)

    return res.status(200).json({
        message: 'success',
        data: result
    })
}