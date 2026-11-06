import type { Request, Response } from "express"
import { addJob, deleteJob, findAllJob, findJobById, updateJob } from "../services/jobServices.js"
import { AppError } from "../middleware/errorHandler.js"
import { createAnalysis, getAnalysisListByJobId } from "../services/analysisServices.js"

export const jobListController = async (req: Request, res: Response) => {
    const result = await findAllJob(req.userId)

    return res.status(200).send({
        message: 'success',
        data: result
    })
}

export const addJobController = async (req: Request, res: Response) => {
    const result = await addJob(req.userId, req.body)

    return res.status(201).send({
        message: 'success',
        data: result
    })
}

export const updateJobController = async (req: Request, res: Response) => {
    const result = await updateJob(req.userId, { id: req.params.id, job: req.body })

    if (!result) {
        throw new AppError(`Job not found`, 404);
    }

    return res.status(200).send({
        message: 'success',
        data: result
    })
}

export const deleteJobController = async (req: Request, res: Response) => {
    const result = await deleteJob(req.params.id, req.userId)

    if (!result) {
        throw new AppError(`Job not found`, 404);
    }

    return res.sendStatus(204);
}

export const createAnalysisController = async (req: Request, res: Response) => {
    const result = await createAnalysis(req.userId, req.params.id)

    if (!result) {
        throw new AppError(`Job create fail`, 400);
    }

    return res.status(201).json({
        message: "success",
        data: result
    });
}

export const getAnalysisListByJobIdController = async (req: Request, res: Response) => { 
    // jobid -> analysis findmany -> return
    const analysis = await getAnalysisListByJobId(req.userId, req.params.id)
    
    return res.status(200).json({
        message: 'success',
        data: analysis
    })
}

export const getJobDetailById = async (req: Request, res: Response) => {
    const jobDetail = await findJobById(req.userId, req.params.id)

    return res.status(200).json({
        message: 'success',
        data: jobDetail
    })
}

export const getJobExtract = (req: Request, res: Response) => {
    
}