import { Router } from "express";
import { userRegister, userLogin, getMe } from "../controller/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const userRouter = Router()

userRouter.post('/register', userRegister)
userRouter.post('/login', userLogin)
userRouter.get('/me', authMiddleware, getMe)

export default userRouter