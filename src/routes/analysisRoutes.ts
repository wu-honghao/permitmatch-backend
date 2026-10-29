import { Router } from "express";
import { getAnalysesListController, getAnalysisByIdController } from "../controller/analysisController.js";

const analysisRoutes = Router()

analysisRoutes.get('/:id', getAnalysisByIdController)
analysisRoutes.get('/', getAnalysesListController)

export default analysisRoutes