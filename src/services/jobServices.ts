import { AppError } from "../middleware/errorHandler.js";
import { JobModel, type Job } from "../models/jobModel.js";
import { Types } from 'mongoose';

export async function findJobById(
  userId: string,
  jobId: string
) {
    // TODO
    if(!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(jobId)){
        throw new AppError("Invalid ObjectId", 400);
    }
  
    const result = await JobModel.findOne({
        ownerId: userId,
        _id: jobId
    }).populate({ path: "latestAnalysisId", select: "skillScoreResult.score skillScoreResult.scoreType createdAt"})

    if (!result) {
        throw new AppError("Job not found", 404);
    }

    return result
}

export const editableFields = [
    "title",
    "company",
    "location",
    "rawDescription",
    "salary",
    "contract",
    "educationRequirement",
    "experienceRequirement",
    "permitSupport",
    "requirements"
]

type createJobFields = Omit<Job, "ownerId" | "latestAnalysisId">

export async function addJob(userId: string, job: createJobFields){
    if (
        !Types.ObjectId.isValid(userId)
    ) {
        throw new AppError(`Invalid ObjectId`, 400);
    }

    const data = job;
    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        Object.keys(data).length === 0
    ) {
        throw new AppError(`Invalid job data`, 400);
    }

    const invalidFields = Object.keys(job).filter(
        (key) => !editableFields.includes(key)
    );

    if (invalidFields.length > 0) {
        throw new AppError(`Fields not allowed: ${invalidFields.join(", ")}`, 400);
    }

    return JobModel.create({
        ...job,
        ownerId: userId,
    })
}

type UpdateJobFields = Partial<
  Omit<Job, "ownerId" | "latestAnalysisId">
>;

type UpdateJobInput = {
  id: string;
  job: UpdateJobFields;
};

export async function updateJob(userId: string, updateInput: UpdateJobInput){
    if (
        !Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(updateInput.id)
    ) {
        throw new AppError("Invalid job data", 400);
    }

    const data = updateInput.job;

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        Object.keys(data).length === 0
    ) {
        throw new AppError("Invalid job data", 400);
    }

    const invalidFields = Object.keys(updateInput.job).filter(
        (key) => !editableFields.includes(key)
    );

    if (invalidFields.length > 0) {
        throw new AppError(`Fields not allowed: ${invalidFields.join(", ")}`, 400);
    }

    const updatedJob = await JobModel.findOneAndUpdate(
        {
            _id: updateInput.id,
            ownerId: userId
        },
        { $set: updateInput.job },
        { new: true, runValidators: true }
    );

    return updatedJob
}

export async function deleteJob(id: string, userId: string){
    if (
        !Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(id)
    ) {
        throw new AppError(`Invalid ObjectId`, 400);
    }

    const deletedJob = await JobModel.findOneAndDelete({
        _id: id,
        ownerId: userId
    });

    return deletedJob
}

export async function findAllJob(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid ObjectId', 400);
  }

  const jobs = await JobModel.find({ ownerId: userId })
    .select('title company location latestAnalysisId updatedAt')
    .populate({
      path: 'latestAnalysisId',
      select: 'skillScoreResult.score skillScoreResult.scoreType',
    })
    .sort({ updatedAt: -1 })
    .lean();

  return jobs.map((job) => {
    const analysis = job.latestAnalysisId as unknown as {
      skillScoreResult: {
        score: number | null;
        scoreType: 'weighted' | 'required_only' | 'unavailable';
      };
    } | null;

    return {
      _id: job._id.toString(),
      title: job.title,
      company: job.company,
      location: job.location,
      skillScore: analysis?.skillScoreResult?.score ?? null,
      scoreType: analysis?.skillScoreResult?.scoreType ?? null,
      latestAnalysisId: job.latestAnalysisId,
      updatedAt: job.updatedAt,
    };
  });
}