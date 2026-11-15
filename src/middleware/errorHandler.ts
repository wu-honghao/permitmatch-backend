import { MongoServerError } from "mongodb";
import type { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose';

export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ) {
        super(message);
        this.name = "AppError";
    }
}

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            message: err.message
        });
    }

    if (err instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({
            message: "Database validation failed",
        });
    }

    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            message: "Invalid field value",
        });
    }

    if (
        err instanceof MongoServerError &&
        err.code === 11000
    ) {
        return res.status(409).json({
            message: "Duplicate resource",
        });
    }

    console.error("Unhandled API error:", {
        name: err instanceof Error ? err.name : "UnknownError",
        message: err instanceof Error ? err.message : String(err),
    });

    return res.status(500).json({
        message: "Internal server error"
    });
};