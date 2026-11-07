import "dotenv/config" // import .env
import express from 'express'
import cors from "cors"
import mongoose from 'mongoose'
import { errorHandler } from "./middleware/errorHandler.js"
import userRouter from "./routes/userRoutes.js"
import profileRoutes from "./routes/profileRoutes.js"
import { authMiddleware } from "./middleware/authMiddleware.js"
import jobRoutes from "./routes/jobRoutes.js"
import analysisRoutes from "./routes/analysisRoutes.js"
import crossRoleSkillsGapRoutes from "./routes/crossRoleSkillsGap.js"

const app = express()
app.use(express.json())
const frontendOrigin = process.env.FRONTEND_ORIGIN

if (!frontendOrigin) {
  throw new Error('FRONTEND_ORIGIN is not configured')
}

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN!
}))

app.use('/auth', userRouter)
app.use('/profile', authMiddleware, profileRoutes)
app.use('/jobs', authMiddleware, jobRoutes)
app.use('/analyses', authMiddleware, analysisRoutes)
app.use('/skillsGap', authMiddleware, crossRoleSkillsGapRoutes)
app.use(errorHandler)

const startServer = async () => {
  await mongoose.connect(process.env.MONGODB_URI!)

  app.listen(3000, () => {
    console.log("Server running on port 3000")
  })
}

startServer()

export default app