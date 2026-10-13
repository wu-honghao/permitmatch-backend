import { Router } from "express";
import { getProfile, updateProfile } from "../controller/profileController.js";

const profileRoutes = Router()

profileRoutes.get('/', getProfile)
profileRoutes.put('/', updateProfile)

export default profileRoutes