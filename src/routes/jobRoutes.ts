import { Router } from "express";
import { addJobController, deleteJobController, jobListController, updateJobController, createAnalysisController, getAnalysisListByJobIdController, getJobDetailById } from "../controller/jobController.js";

const jobRoutes = Router()

jobRoutes.get('/', jobListController)
jobRoutes.post('/', addJobController)
jobRoutes.delete('/:id', deleteJobController)
jobRoutes.patch('/:id', updateJobController)

jobRoutes.post('/:id/analyses', createAnalysisController);
jobRoutes.get('/:id/analyses', getAnalysisListByJobIdController);
jobRoutes.get('/:id', getJobDetailById);

export default jobRoutes