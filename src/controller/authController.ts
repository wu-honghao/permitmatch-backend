import type { Request, Response } from 'express'
import { loginSchema, registerSchema } from '../validators/authValidator.js'
import { UserModel } from '../models/userModel.js'
import bcrypt from "bcryptjs"

export const userRegister = async (req: Request, res: Response) => {
    const result = registerSchema.safeParse(req.body)

    if(!result.success){
        return res.status(400).send({
            message: "Invalid user data"
        })
    }

    const { email , password } = result.data

    const existingUser = await UserModel.findOne({ email })

    if (existingUser) {
        return res.status(409).send({
            message: "Email already registered"
        })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const newUser = await UserModel.create({
        email,
        password: passwordHash
    })

    return res.status(201).send({
        message: 'User registered',
        data: {
            id: newUser._id,
            email: newUser.email
        }
    })
}

import jwt from "jsonwebtoken"
export const userLogin = async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body)

    if(!result.success){
        return res.status(400).send({
            message: "Invalid user data"
        })
    }

    const { email, password } = result.data

    const user = await UserModel.findOne({
        email,
    })

    if(!user){
        return res.status(401).send({
            message: "Invalid email or password"
        })
    }

    const passwordCompare = await bcrypt.compare(password, user.password)
    if(!passwordCompare){
        return res.status(401).send({
            message: "Invalid email or password"
        })
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined")
    }
    const token = jwt.sign({ userId:user.id }, process.env.JWT_SECRET, { expiresIn: '1h' })

    return res.status(200).send({
        message: "Login successful",
        data: {
            token
        }
    })
}

export const getMe = async (req: Request, res: Response) => {
    const user = await UserModel.findOne({
        _id: req.userId
    })

    if(!user){
        return res.status(401).send({
            message: "Invalid User"
        })
    }

    return res.status(200).send({
        message: 'success',
        data: {
            id: user._id,
            email: user.email,
        }
    })
}