import mongoose, { Types } from "mongoose"
import { AppError } from "../middleware/errorHandler.js"
import { AnalysisModel } from "../models/analysisModel.js"
import { CandidateProfileModel } from "../models/candidateProfile.js"
import { JobModel, type Job } from "../models/jobModel.js"
import { calculateSkillScore } from "./skillScoring.js"
import { findJobById } from "./jobServices.js"

const profileSnapshotFields = [
  "needsPermit",
  "targetRole",
  "educationLevel",
  "yearsExperience",
  "skills",
  "preferredLocation"
];

const jobSnapshotFields = [
  "title",
  "company",
  "location",
  "rawDescription",
  "salary",
  "contract",
  "educationRequirement",
  "experienceRequirement",
  "requirements",
  "permitSupport"
];

export const createAnalysis = async (userId: string, jobid: string) => {
    if (
        !Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(jobid)
    ) {
        throw new AppError("Invalid ObjectId", 400);
    }

    return mongoose.connection.transaction(async (session)=>{
        const profile = await CandidateProfileModel.findOne({ userId }).select(profileSnapshotFields.join(" ") + " -_id").session(session)
        .lean();
        const job = await JobModel.findOne({ _id: jobid, ownerId: userId }).select(jobSnapshotFields.join(" ") + " -_id").session(session)
        .lean();

        if (!profile) {
            throw new AppError("Profile not found", 404);
        }

        if (!job) {
            throw new AppError("Job not found", 404);
        }

        if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
            throw new AppError("Profile skills are required", 400);
        }

        if (!Array.isArray(job.requirements)) {
            throw new AppError("Invalid job requirements", 400);
        }

        const requirements = job.requirements.map((item) => ({
            category: item.category,
            operator: item.operator ?? "all",
            skills: item.skills,
            rawContent: item.rawContent ?? null
        }));

        const skillScoreResult = calculateSkillScore(
            profile.skills,
            requirements
        );
        
        const analysis = new AnalysisModel({
            ownerId: userId,
            jobId: jobid,
            profileSnapshot: profile,
            jobSnapshot: job,
            skillScoreResult,
        })

        await analysis.save({ session })

        const result = await JobModel.updateOne({ ownerId: userId, _id: jobid }, { $set: { latestAnalysisId: analysis._id } }, { session })

        if (result.matchedCount !== 1) {
            throw new AppError("Job not found", 404);
        }

        return analysis;
    })
}

export const getAnalysisListByJobId = async (userId: string, jobid: string) => {
    // 1. 检查 Job 是否属于当前用户
    const job = await findJobById(userId, jobid);

    if (!job) {
        throw new AppError("Job not found", 404);
    }

    const analysis = await AnalysisModel.find({ ownerId: userId, jobId: jobid }).sort({ createdAt: -1 })

    return analysis
}

export const getAnalysisById = async (userId: string, analysisId: string) => {
    if (
        !Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(analysisId)
    ) {
        throw new AppError("Invalid ObjectId", 400);
    }

    const result = await AnalysisModel.findOne({ ownerId: userId, _id: analysisId })

    if(!result){
        throw new AppError("Analysis not found", 404);
    }

    return result
}

export const getAnalysesList = async (userId: string) => {
    const analyses = await AnalysisModel.find({ ownerId: userId })
    .sort({ createdAt: -1 })
    .lean();

    const jobIds = analyses.map(a => a.jobId);

    const jobs = await JobModel.find({
        _id: { $in: jobIds },
        ownerId: userId
    }).select("_id");

    const existingJobIds = new Set(
        jobs.map(job => String(job._id))
    );

    return analyses.map(analysis => ({
        ...analysis,
        jobExists: existingJobIds.has(String(analysis.jobId))
    }));
};