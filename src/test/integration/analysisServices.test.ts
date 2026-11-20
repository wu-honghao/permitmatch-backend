import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import mongoose, { Types } from "mongoose";
import { connectTestDB, disconnectTestDB } from "../testDb.js";
import { AnalysisModel } from "../../models/analysisModel.js";
import { CandidateProfileModel } from "../../models/candidateProfile.js";
import { JobModel } from "../../models/jobModel.js";
import { createAnalysis } from "../../services/analysisServices.js";

// Integration tests: run against a disposable MongoDB replica set using permitmatch_test.
// Database writes stay REAL; updateOne is only mocked once to inject a failure.
const createdUserIds: Types.ObjectId[] = [];

function newOwnerId() {
  const id = new Types.ObjectId();
  createdUserIds.push(id);
  return id;
}

async function makeProfile(ownerId: Types.ObjectId, skills = ["React", "TypeScript"]) {
  return CandidateProfileModel.create({
    userId: ownerId,
    needsPermit: true,
    targetRole: "React Developer",
    educationLevel: "bachelor",
    yearsExperience: 2,
    skills,
    preferredLocation: "Dublin",
  });
}

async function makeJob(ownerId: Types.ObjectId) {
  return JobModel.create({
    ownerId,
    title: "React Developer",
    company: "Example Ltd",
    location: "Dublin",
    rawDescription: "React and TypeScript required; Node.js required",
    requirements: [
      { category: "required", operator: "all", skills: ["React", "TypeScript"], rawContent: "React and TypeScript" },
      { category: "required", operator: "all", skills: ["Node.js"], rawContent: "Node.js" },
    ],
  });
}

beforeAll(async () => {
  await connectTestDB();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1 && createdUserIds.length > 0) {
      const ownerIds = { $in: createdUserIds };
      await AnalysisModel.deleteMany({ ownerId: ownerIds });
      await JobModel.deleteMany({ ownerId: ownerIds });
      await CandidateProfileModel.deleteMany({ userId: ownerIds });
    }
  } finally {
    await disconnectTestDB();
  }
});

describe("createAnalysis integration", () => {
  it("A10: creates persisted analysis, calculates 67 points, and links job", async () => {
    const ownerId = newOwnerId();
    await makeProfile(ownerId);
    const job = await makeJob(ownerId);

    const result = await createAnalysis(ownerId.toString(), job._id.toString());
    const persisted = await AnalysisModel.findById(result._id);
    const updatedJob = await JobModel.findById(job._id);

    expect(persisted).not.toBeNull();
    expect(persisted?.ownerId.toString()).toBe(ownerId.toString());
    expect(persisted?.jobId.toString()).toBe(job._id.toString());
    expect(persisted?.skillScoreResult).toMatchObject({
      score: 67,
      scoreType: "required_only",
      required: { matched: 2, total: 3 },
    });
    expect(updatedJob?.latestAnalysisId?.toString()).toBe(result._id.toString());
  });

  it("A11: retains historical profile and job snapshots after original documents change", async () => {
    const ownerId = newOwnerId();
    const profile = await makeProfile(ownerId);
    const job = await makeJob(ownerId);
    const result = await createAnalysis(ownerId.toString(), job._id.toString());

    await CandidateProfileModel.updateOne({ _id: profile._id }, { $set: { skills: ["Python"] } });
    await JobModel.updateOne({ _id: job._id }, { $set: { title: "Python Developer" } });

    // Fresh read from MongoDB, rather than checking the object returned at creation time.
    const historical = await AnalysisModel.findById(result._id);
    expect(historical?.profileSnapshot.skills).toEqual(["React", "TypeScript"]);
    expect(historical?.jobSnapshot.title).toBe("React Developer");
    expect(historical?.skillScoreResult.score).toBe(67);
    expect((await CandidateProfileModel.findById(profile._id))?.skills).toEqual(["Python"]);
    expect((await JobModel.findById(job._id))?.title).toBe("Python Developer");
  });

  it("A12: rolls back the Analysis insert if updating the Job fails", async () => {
    const ownerId = newOwnerId();
    await makeProfile(ownerId);
    const job = await makeJob(ownerId);
    const ownerIdString = ownerId.toString();
    const jobIdString = job._id.toString();

    const beforeCount = await AnalysisModel.countDocuments({ ownerId, jobId: job._id });
    const beforeJob = await JobModel.findById(job._id);
    const updateSpy = vi.spyOn(JobModel, "updateOne").mockRejectedValueOnce(new Error("Simulated update failure"));

    await expect(createAnalysis(ownerIdString, jobIdString)).rejects.toThrow("Simulated update failure");
    expect(updateSpy).toHaveBeenCalledOnce();

    // Both reads happen AFTER the failed transaction, outside the transaction session.
    const afterCount = await AnalysisModel.countDocuments({ ownerId, jobId: job._id });
    const afterJob = await JobModel.findById(job._id);
    expect(afterCount).toBe(beforeCount);
    expect(afterJob?.latestAnalysisId?.toString()).toBe(beforeJob?.latestAnalysisId?.toString());
  });

  it("A13: rejects a missing profile without creating an analysis", async () => {
    const ownerId = newOwnerId();
    const job = await makeJob(ownerId);
    await expect(createAnalysis(ownerId.toString(), job._id.toString())).rejects.toMatchObject({
      statusCode: 404,
      message: "Profile not found",
    });
    expect(await AnalysisModel.countDocuments({ ownerId, jobId: job._id })).toBe(0);
  });

  it("A14: rejects a job not owned by the requester without creating an analysis", async () => {
    const requesterId = newOwnerId();
    const otherOwnerId = newOwnerId();
    await makeProfile(requesterId);
    const otherJob = await makeJob(otherOwnerId);

    await expect(createAnalysis(requesterId.toString(), otherJob._id.toString())).rejects.toMatchObject({
      statusCode: 404,
      message: "Job not found",
    });
    expect(await AnalysisModel.countDocuments({ ownerId: requesterId, jobId: otherJob._id })).toBe(0);
    expect((await JobModel.findById(otherJob._id))?.latestAnalysisId).toBeNull();
  });

  it("A15: rejects an empty skills profile without creating an analysis", async () => {
    const ownerId = newOwnerId();
    await makeProfile(ownerId, []);
    const job = await makeJob(ownerId);

    await expect(createAnalysis(ownerId.toString(), job._id.toString())).rejects.toMatchObject({
      statusCode: 400,
      message: "Profile skills are required",
    });
    expect(await AnalysisModel.countDocuments({ ownerId, jobId: job._id })).toBe(0);
  });
});
