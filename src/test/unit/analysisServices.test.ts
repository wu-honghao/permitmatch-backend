import { afterEach, describe, expect, it, vi } from "vitest";
import mongoose, { Types } from "mongoose";
import { AnalysisModel } from "../../models/analysisModel.js";
import { JobModel } from "../../models/jobModel.js";
import {
  createAnalysis,
  getAnalysisById,
  getAnalysisListByJobId,
  getAnalysesList,
} from "../../services/analysisServices.js";

const userId = new Types.ObjectId().toString();
const jobId = new Types.ObjectId().toString();
const analysisId = new Types.ObjectId().toString();

afterEach(() => vi.restoreAllMocks());

describe("analysisServices — query and validation unit tests", () => {
  it("A01: rejects an invalid user ID before starting a transaction", async () => {
    const transactionSpy = vi.spyOn(mongoose.connection, "transaction");

    await expect(createAnalysis("invalid-user", jobId)).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid ObjectId",
    });
    expect(transactionSpy).not.toHaveBeenCalled();
  });

  it("A02: rejects an invalid job ID before starting a transaction", async () => {
    const transactionSpy = vi.spyOn(mongoose.connection, "transaction");

    await expect(createAnalysis(userId, "invalid-job")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid ObjectId",
    });
    expect(transactionSpy).not.toHaveBeenCalled();
  });

  it("A03: fetches only the current user's analysis by ID", async () => {
    const savedAnalysis = { _id: analysisId, ownerId: userId, jobId };
    const findSpy = vi.spyOn(AnalysisModel, "findOne").mockResolvedValue(savedAnalysis as never);

    const result = await getAnalysisById(userId, analysisId);

    expect(findSpy).toHaveBeenCalledOnce();
    expect(findSpy).toHaveBeenCalledWith({ ownerId: userId, _id: analysisId });
    expect(result).toBe(savedAnalysis);
  });

  it("A04: rejects unknown analysis without revealing other users' data", async () => {
    const findSpy = vi.spyOn(AnalysisModel, "findOne").mockResolvedValue(null);

    await expect(getAnalysisById(userId, analysisId)).rejects.toMatchObject({
      statusCode: 404,
      message: "Analysis not found",
    });
    expect(findSpy).toHaveBeenCalledWith({ ownerId: userId, _id: analysisId });
  });

  it("A05: rejects malformed analysis ID without a database lookup", async () => {
    const findSpy = vi.spyOn(AnalysisModel, "findOne");

    await expect(getAnalysisById(userId, "bad-id")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid ObjectId",
    });
    expect(findSpy).not.toHaveBeenCalled();
  });

  it("A06: lists a job's analyses only after checking job ownership", async () => {
    const populatedJob = { _id: jobId, ownerId: userId };
    const populateMock = vi.fn().mockResolvedValue(populatedJob);
    const jobFindSpy = vi.spyOn(JobModel, "findOne").mockReturnValue({ populate: populateMock } as never);

    const analyses = [{ _id: analysisId, jobId, ownerId: userId }];
    const sortMock = vi.fn().mockResolvedValue(analyses);
    const analysisFindSpy = vi.spyOn(AnalysisModel, "find").mockReturnValue({ sort: sortMock } as never);

    const result = await getAnalysisListByJobId(userId, jobId);

    expect(jobFindSpy).toHaveBeenCalledWith({ ownerId: userId, _id: jobId });
    expect(populateMock).toHaveBeenCalledOnce();
    expect(analysisFindSpy).toHaveBeenCalledWith({ ownerId: userId, jobId });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toBe(analyses);
  });

  it("A07: does not list analyses when the job is not owned by the user", async () => {
    const populateMock = vi.fn().mockResolvedValue(null);
    const jobFindSpy = vi.spyOn(JobModel, "findOne").mockReturnValue({ populate: populateMock } as never);
    const analysisFindSpy = vi.spyOn(AnalysisModel, "find");

    await expect(getAnalysisListByJobId(userId, jobId)).rejects.toMatchObject({
      statusCode: 404,
      message: "Job not found",
    });
    expect(jobFindSpy).toHaveBeenCalledWith({ ownerId: userId, _id: jobId });
    expect(analysisFindSpy).not.toHaveBeenCalled();
  });

  it("A08: marks existing and deleted jobs correctly in analysis history", async () => {
    const deletedJobId = new Types.ObjectId();
    const existingJobId = new Types.ObjectId();
    const analyses = [
      { _id: new Types.ObjectId(), jobId: existingJobId, title: "Existing" },
      { _id: new Types.ObjectId(), jobId: deletedJobId, title: "Deleted" },
    ];
    const leanMock = vi.fn().mockResolvedValue(analyses);
    const sortMock = vi.fn().mockReturnValue({ lean: leanMock });
    const analysisFindSpy = vi.spyOn(AnalysisModel, "find").mockReturnValue({ sort: sortMock } as never);

    const selectMock = vi.fn().mockResolvedValue([{ _id: existingJobId }]);
    const jobFindSpy = vi.spyOn(JobModel, "find").mockReturnValue({ select: selectMock } as never);

    const result = await getAnalysesList(userId);

    expect(analysisFindSpy).toHaveBeenCalledWith({ ownerId: userId });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(jobFindSpy).toHaveBeenCalledWith({
      _id: { $in: [existingJobId, deletedJobId] },
      ownerId: userId,
    });
    expect(selectMock).toHaveBeenCalledWith("_id");
    expect(result).toEqual([
      { ...analyses[0], jobExists: true },
      { ...analyses[1], jobExists: false },
    ]);
    expect(analyses[0]).not.toHaveProperty("jobExists");
  });

  it("A09: returns an empty list when the user has no analyses", async () => {
    const leanMock = vi.fn().mockResolvedValue([]);
    const sortMock = vi.fn().mockReturnValue({ lean: leanMock });
    vi.spyOn(AnalysisModel, "find").mockReturnValue({ sort: sortMock } as never);
    const selectMock = vi.fn().mockResolvedValue([]);
    const jobFindSpy = vi.spyOn(JobModel, "find").mockReturnValue({ select: selectMock } as never);

    const result = await getAnalysesList(userId);

    expect(result).toEqual([]);
    // Current implementation performs a second query even for an empty list.
    expect(jobFindSpy).toHaveBeenCalledWith({ _id: { $in: [] }, ownerId: userId });
  });
});
