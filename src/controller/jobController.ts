import type { Request, Response } from "express";
import {
    addJob,
    deleteJob,
    findAllJob,
    findJobById,
    updateJob
} from "../services/jobServices.js";
import { AppError } from "../middleware/errorHandler.js";
import {
    createAnalysis,
    getAnalysisListByJobId
} from "../services/analysisServices.js";

export const jobListController = async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) throw new AppError("Unauthorized", 401);

    const result = await findAllJob(userId);

    return res.status(200).json({
        message: "success",
        data: result
    });
};

export const addJobController = async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) throw new AppError("Unauthorized", 401);

    const result = await addJob(userId, req.body);

    return res.status(201).json({
        message: "success",
        data: result
    });
};

export const updateJobController = async (req: Request, res: Response) => {
    const userId = req.userId;
    const id = req.params.id;

    if (!userId) throw new AppError("Unauthorized", 401);
    if (typeof id !== "string") {
        throw new AppError("Invalid job ID", 400);
    }

    const result = await updateJob(userId, {
        id,
        job: req.body
    });

    if (!result) {
        throw new AppError("Job not found", 404);
    }

    return res.status(200).json({
        message: "success",
        data: result
    });
};

export const deleteJobController = async (req: Request, res: Response) => {
    const userId = req.userId;
    const id = req.params.id;

    if (!userId) throw new AppError("Unauthorized", 401);
    if (typeof id !== "string") {
        throw new AppError("Invalid job ID", 400);
    }

    const result = await deleteJob(id, userId);

    if (!result) {
        throw new AppError("Job not found", 404);
    }

    return res.sendStatus(204);
};

export const createAnalysisController = async (req: Request, res: Response) => {
    const userId = req.userId;
    const id = req.params.id;

    if (!userId) throw new AppError("Unauthorized", 401);
    if (typeof id !== "string") {
        throw new AppError("Invalid job ID", 400);
    }

    const result = await createAnalysis(userId, id);

    if (!result) {
        throw new AppError("Job create fail", 400);
    }

    return res.status(201).json({
        message: "success",
        data: result
    });
};

export const getAnalysisListByJobIdController = async (
    req: Request,
    res: Response
) => {
    const userId = req.userId;
    const id = req.params.id;

    if (!userId) throw new AppError("Unauthorized", 401);
    if (typeof id !== "string") {
        throw new AppError("Invalid job ID", 400);
    }

    const analysis = await getAnalysisListByJobId(userId, id);

    return res.status(200).json({
        message: "success",
        data: analysis
    });
};

export const getJobDetailById = async (req: Request, res: Response) => {
    const userId = req.userId;
    const id = req.params.id;

    if (!userId) throw new AppError("Unauthorized", 401);
    if (typeof id !== "string") {
        throw new AppError("Invalid job ID", 400);
    }

    const jobDetail = await findJobById(userId, id);

    return res.status(200).json({
        message: "success",
        data: jobDetail
    });
};