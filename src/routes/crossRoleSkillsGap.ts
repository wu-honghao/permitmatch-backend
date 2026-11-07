import { Router } from "express";
import { getCrossRoleSkillsGap } from "../controller/crossRoleSkillsGapController.js";

const crossRoleSkillsGapRoutes = Router()

crossRoleSkillsGapRoutes.get('/', getCrossRoleSkillsGap)

export default crossRoleSkillsGapRoutes