import { Router } from "express";
import { addJobController, deleteJobController, jobListController, updateJobController, createAnalysisController, getAnalysisListByJobIdController, getJobDetailById } from "../controller/jobController.js";
import { extractJobController } from "../controller/jobExtractionController.js";

const jobRoutes = Router()

jobRoutes.get('/', jobListController)
jobRoutes.post('/', addJobController)
jobRoutes.delete('/:id', deleteJobController)
jobRoutes.patch('/:id', updateJobController)

jobRoutes.post('/:id/analyses', createAnalysisController);
jobRoutes.get('/:id/analyses', getAnalysisListByJobIdController);
jobRoutes.get('/:id', getJobDetailById);
jobRoutes.post('/extract', extractJobController)

export default jobRoutes