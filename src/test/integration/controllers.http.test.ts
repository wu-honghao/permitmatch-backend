/**
 * HTTP route/controller contract tests (real Express routing, middleware, Supertest;
 * mocked services; no MongoDB or Gemini network dependency).
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

const mocks = vi.hoisted(() => ({
  crossRoleSkillsGap: vi.fn(),
  extractJobDescription: vi.fn(),
  getAnalysesList: vi.fn(),
  getAnalysisById: vi.fn(),
  findAllJob: vi.fn(),
  findJobById: vi.fn(),
  addJob: vi.fn(),
  updateJob: vi.fn(),
  deleteJob: vi.fn(),
  createAnalysis: vi.fn(),
  getAnalysisListByJobId: vi.fn(),
}));

vi.mock("../../services/crossRoleSkillsGapServices.js", () => ({
  crossRoleSkillsGap: mocks.crossRoleSkillsGap,
}));
vi.mock("../../services/jobExtractionService.js", () => ({
  extractJobDescription: mocks.extractJobDescription,
}));
vi.mock("../../services/analysisServices.js", () => ({
  getAnalysesList: mocks.getAnalysesList,
  getAnalysisById: mocks.getAnalysisById,
  createAnalysis: mocks.createAnalysis,
  getAnalysisListByJobId: mocks.getAnalysisListByJobId,
}));
vi.mock("../../services/jobServices.js", () => ({
  findAllJob: mocks.findAllJob,
  findJobById: mocks.findJobById,
  addJob: mocks.addJob,
  updateJob: mocks.updateJob,
  deleteJob: mocks.deleteJob,
}));

import app from "../../app.js";

const userId = new Types.ObjectId().toString();
const jobId = new Types.ObjectId().toString();
const analysisId = new Types.ObjectId().toString();
const originalJwtSecret = process.env.JWT_SECRET;
let token: string;
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeAll(() => {
  process.env.JWT_SECRET = "permitmatch-http-contract-test-secret";
  token = jwt.sign({ userId }, process.env.JWT_SECRET);
});
afterAll(() => {
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});
afterEach(() => vi.resetAllMocks());

describe("HTTP authentication and skill gaps", () => {
  it("H01: rejects an unauthenticated gap request without calling the service", async () => {
    const res = await request(app).get("/skillsGap");
    expect(res.status).toBe(401);
    expect(mocks.crossRoleSkillsGap).not.toHaveBeenCalled();
  });

  it("H02: returns gaps for the authenticated user", async () => {
    const result = { totalJobs: 2, gaps: [{ skills: ["React"], requiredCount: 2, preferredCount: 0, totalCount: 2 }] };
    mocks.crossRoleSkillsGap.mockResolvedValue(result);
    const res = await request(app).get("/skillsGap").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "success", data: result });
    expect(mocks.crossRoleSkillsGap).toHaveBeenCalledExactlyOnceWith(userId);
  });

  it("H03: returns empty gap summary without analyses", async () => {
    mocks.crossRoleSkillsGap.mockResolvedValue({ totalJobs: 0, gaps: [] });
    const res = await request(app).get("/skillsGap").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ totalJobs: 0, gaps: [] });
  });
});

describe("HTTP Gemini extraction", () => {
  // Use one request per test to stay below rate-limiting thresholds.
  it("H04: rejects invalid JD before calling Gemini", async () => {
    const res = await request(app).post("/jobs/extract").set(auth()).send({ rawDescription: "short" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid job description");
    expect(mocks.extractJobDescription).not.toHaveBeenCalled();
  });

  it("H05: validates, trims and forwards a JD to extraction service", async () => {
    const jd = "Seeking a React and TypeScript engineer in Dublin, Ireland.";
    const draft = { title: "React Developer", rawDescription: jd };
    mocks.extractJobDescription.mockResolvedValue(draft);
    const res = await request(app).post("/jobs/extract").set(auth()).send({ rawDescription: `  ${jd}  ` });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "success", data: draft });
    expect(mocks.extractJobDescription).toHaveBeenCalledExactlyOnceWith(jd);
  });

  it("H06: maps provider failure to an HTTP error", async () => {
    const { AppError } = await import("../../middleware/errorHandler.js");
    mocks.extractJobDescription.mockRejectedValue(new AppError("AI provider rate limit exceeded", 503));
    const res = await request(app).post("/jobs/extract").set(auth())
      .send({ rawDescription: "Seeking a React and TypeScript engineer in Dublin, Ireland." });
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ message: "AI provider rate limit exceeded" });
  });
});

describe("HTTP analysis retrieval", () => {
  it("H07: rejects missing auth before looking up analyses", async () => {
    const res = await request(app).get("/analyses");
    expect(res.status).toBe(401);
    expect(mocks.getAnalysesList).not.toHaveBeenCalled();
  });

  it("H08: lists the authenticated user's analyses", async () => {
    const analyses = [{ _id: analysisId, jobId, jobExists: true }];
    mocks.getAnalysesList.mockResolvedValue(analyses);
    const res = await request(app).get("/analyses").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "success", data: analyses });
    expect(mocks.getAnalysesList).toHaveBeenCalledExactlyOnceWith(userId);
  });

  it("H09: returns an analysis and passes the correct owner filter", async () => {
    const analysis = { _id: analysisId, ownerId: userId, jobId };
    mocks.getAnalysisById.mockResolvedValue(analysis);
    const res = await request(app).get(`/analyses/${analysisId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(analysis);
    expect(mocks.getAnalysisById).toHaveBeenCalledExactlyOnceWith(userId, analysisId);
  });

  it("H10: returns 404 when the service cannot find the analysis", async () => {
    const { AppError } = await import("../../middleware/errorHandler.js");
    mocks.getAnalysisById.mockRejectedValue(new AppError("Analysis not found", 404));
    const res = await request(app).get(`/analyses/${analysisId}`).set(auth());
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Analysis not found" });
  });

  it("H11: returns 400 for an invalid analysis ID", async () => {
    const { AppError } = await import("../../middleware/errorHandler.js");
    mocks.getAnalysisById.mockRejectedValue(new AppError("Invalid ObjectId", 400));
    const res = await request(app).get("/analyses/not-an-id").set(auth());
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid ObjectId");
  });
});

describe("HTTP jobs controller contract", () => {
  it("H12: returns job list filtered by authenticated user", async () => {
    const jobs = [{ _id: jobId, title: "React Developer", skillScore: null }];
    mocks.findAllJob.mockResolvedValue(jobs);
    const res = await request(app).get("/jobs").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(jobs);
    expect(mocks.findAllJob).toHaveBeenCalledExactlyOnceWith(userId);
  });

  it("H13: rejects invalid create body before calling service", async () => {
    const res = await request(app).post("/jobs").set(auth()).send({ ownerId: "fake", title: "React Developer" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid job data");
    expect(mocks.addJob).not.toHaveBeenCalled();
  });

  it("H14: creates a job using validated data and current user", async () => {
    const created = { _id: jobId, ownerId: userId, title: "React Developer" };
    mocks.addJob.mockResolvedValue(created);
    const res = await request(app).post("/jobs").set(auth()).send({ title: "React Developer" });
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(created);
    expect(mocks.addJob).toHaveBeenCalledExactlyOnceWith(userId, expect.objectContaining({
      title: "React Developer", requirements: [], salary: null,
    }));
  });

  it("H15: rejects empty PATCH body before calling service", async () => {
    const res = await request(app).patch(`/jobs/${jobId}`).set(auth()).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid job data");
    expect(mocks.updateJob).not.toHaveBeenCalled();
  });

  it("H16: PATCH returns 404 when the owned job does not exist", async () => {
    mocks.updateJob.mockResolvedValue(null);
    const res = await request(app).patch(`/jobs/${jobId}`).set(auth()).send({ title: "Updated" });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Job not found");
    expect(mocks.updateJob).toHaveBeenCalledExactlyOnceWith(userId, {
      id: jobId, job: { title: "Updated" },
    });
  });

  it("H17: DELETE returns 204 when a job is deleted", async () => {
    mocks.deleteJob.mockResolvedValue({ _id: jobId });
    const res = await request(app).delete(`/jobs/${jobId}`).set(auth());
    expect(res.status).toBe(204);
    expect(mocks.deleteJob).toHaveBeenCalledExactlyOnceWith(jobId, userId);
  });

  it("H18: DELETE returns 404 when an owned job is missing", async () => {
    mocks.deleteJob.mockResolvedValue(null);
    const res = await request(app).delete(`/jobs/${jobId}`).set(auth());
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Job not found");
  });

  it("H19: returns latest job detail with correct owner", async () => {
    const detail = { _id: jobId, ownerId: userId, title: "React Developer" };
    mocks.findJobById.mockResolvedValue(detail);
    const res = await request(app).get(`/jobs/${jobId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(detail);
    expect(mocks.findJobById).toHaveBeenCalledExactlyOnceWith(userId, jobId);
  });

  it("H20: returns historical analyses for an owned job", async () => {
    const data = [{ _id: analysisId, jobId }];
    mocks.getAnalysisListByJobId.mockResolvedValue(data);
    const res = await request(app).get(`/jobs/${jobId}/analyses`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(data);
    expect(mocks.getAnalysisListByJobId).toHaveBeenCalledExactlyOnceWith(userId, jobId);
  });

  it("H21: POST analysis returns 201 and forwards the job and user IDs", async () => {
    const data = { _id: analysisId, ownerId: userId, jobId };
    mocks.createAnalysis.mockResolvedValue(data);
    const res = await request(app).post(`/jobs/${jobId}/analyses`).set(auth());
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(data);
    expect(mocks.createAnalysis).toHaveBeenCalledExactlyOnceWith(userId, jobId);
  });
});
