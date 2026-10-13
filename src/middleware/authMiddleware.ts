import type { NextFunction, Request, Response } from "express"
import jwt from 'jsonwebtoken'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization
    if(!authorization || !authorization.startsWith('Bearer ')){
        return res.status(401).send({
            message: "Unauthorized"
        })
    }

    const token = authorization.slice(7)

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured')
    }

    try{
        const payload = jwt.verify(token, jwtSecret)

        if (
            typeof payload === "string" ||
            typeof payload.userId !== "string"
        ) {
            return res.status(401).send({
                message: "Invalid token payload"
            })
        }

        req.userId = payload.userId
        next()
    }
    catch(e){
        console.error(e)
        return res.status(401).send({
            message: "Invalid or expired token"
        })
    }
}