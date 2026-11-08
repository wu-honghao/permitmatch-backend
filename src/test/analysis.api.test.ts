import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { connectTestDB, disconnectTestDB } from "./testDb.js";
import { createTestUser } from "./helpers/testAuth.js";
import { CandidateProfileModel } from "../models/candidateProfile.js";
import { JobModel } from "../models/jobModel.js";
import request from 'supertest'
import app from "../app.js";
import { AnalysisModel } from "../models/analysisModel.js";
import mongoose from "mongoose";
import { UserModel } from "../models/userModel.js";

let userA: Awaited<ReturnType<typeof createTestUser>> | undefined;
let userB: Awaited<ReturnType<typeof createTestUser>> | undefined;
let jobId: string | null = null
let analysisId: null = null

beforeAll(async ()=>{
    await connectTestDB()

    userA = await createTestUser()
    userB = await createTestUser()

    await CandidateProfileModel.create({
        userId: userA.userId,
        needsPermit: true,
        targetRole: "Full Stack Developer",
        educationLevel: "bachelor",
        yearsExperience: 3,
        skills: ["React", "TypeScript", "Node.js"],
        preferredLocation: "Dublin"
    })

    const job = await JobModel.create({
        ownerId: userA.userId,
        title: "Full Stack Developer",
        company: "Test Company",
        location: "Dublin",
        rawDescription: "React and TypeScript required.",
        requirements: [
            {
                category: "required",
                operator: "all",
                skills: ["React", "TypeScript"]
            }
        ]
    })

    jobId = job._id.toString()
})

describe('analysis.api', () => {
    it('T0 analysis creates successfully and return 201', async () => {
        if (!userA || !jobId) {
            throw new Error("Test setup failed");
        }

        const res = await request(app).post(`/jobs/${jobId}/analyses`).set('Authorization', `Bearer ${userA.token}`)
        expect(res.status).toBe(201)

        analysisId = res.body.data._id;

        const analysis = await AnalysisModel.findById(analysisId);
        const job = await JobModel.findById(jobId);

        expect(analysis).not.toBeNull()
        expect(analysis?.ownerId.toString()).toBe(userA.userId)
        expect(analysis?.skillScoreResult.score).toBe(100)

        expect(job?.latestAnalysisId?.toString()).toBe(analysisId)
    })

    it("T1 analysis creates error return 500 and rollback", async () => {
        if (!userA || !jobId) {
            throw new Error("Test setup failed");
        }

        const updateSpy = vi.spyOn(JobModel, "updateOne").mockImplementationOnce(()=>{
            throw new Error('Simulated update failure')
        })

        try {
            const job = await JobModel.findById(jobId)
            const countBefore = await AnalysisModel.countDocuments({ jobId })

            const res = await request(app).post(`/jobs/${jobId}/analyses`).set('Authorization', `Bearer ${userA.token}`)

            expect(res.status).toBe(500)

            // TODO 3: 确认 Mock 确实被调用
            expect(updateSpy).toHaveBeenCalledTimes(1)
            // TODO 4: 再次查询 Analysis 数量，确认没有增加
            const countAfter = await AnalysisModel.countDocuments({ jobId })
            expect(countBefore).toBe(countAfter)
            // TODO 5: 再次查询 latestAnalysisId，确认没有变化
            const jobUpdated = await JobModel.findById(jobId)

            expect(job?.latestAnalysisId?.toString()).toBe(jobUpdated?.latestAnalysisId?.toString())
        } finally {
            updateSpy.mockRestore()
        }
    })

    it("T2 userA check userA analysis", async () => {
        if (!userA || !analysisId) {
            throw new Error("Test setup failed");
        }

        const res = await request(app).get(`/analyses/${analysisId}`).set("Authorization", `Bearer ${userA.token}`)

        expect(res.status).toBe(200)
    })

    it("T3 userB check userA analysis", async () => {
        if (!userB || !userA || !analysisId) {
            throw new Error("Test setup failed");
        }

        const res = await request(app).get(`/analyses/${analysisId}`).set("Authorization", `Bearer ${userB.token}`)

        expect(res.status).toBe(404)
    })

    it("T4 userB get analysis for userA jobs", async () => {
        if (!userB || !userA) {
            throw new Error("Test setup failed");
        }

        const res = await request(app).get(`/jobs/${jobId}/analyses`).set("Authorization", `Bearer ${userB.token}`)

        expect(res.status).toBe(404)
    })

    it("T5 userB create analysis for userA jobs", async () => {
        if (!userB || !userA) {
            throw new Error("Test setup failed");
        }

        const countBefore = await AnalysisModel.countDocuments({ jobId })
        const job = await JobModel.findById(jobId)
        
        const res = await request(app).post(`/jobs/${jobId}/analyses`).set("Authorization", `Bearer ${userB.token}`)

        const countAfter = await AnalysisModel.countDocuments({ jobId })
        const jobAfter = await JobModel.findById(jobId)

        expect(res.status).toBe(404)
        expect(countBefore).toBe(countAfter)
        expect(job?.latestAnalysisId?.toString()).toBe(jobAfter?.latestAnalysisId?.toString())
    })
})

afterAll(async ()=>{
    try {
        if(mongoose.connection.readyState === 1 && userA?.userId){
            await AnalysisModel.deleteMany({ ownerId: userA.userId })

            await JobModel.deleteMany({ ownerId: userA.userId })

            await CandidateProfileModel.deleteMany({ userId: userA.userId })

            await UserModel.deleteMany({ _id: userA.userId })
        }
    } finally { 
        await disconnectTestDB()
    }
})