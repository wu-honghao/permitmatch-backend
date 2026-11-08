import { afterAll, beforeAll, describe, expect, test } from "vitest";
import app from "../app.js";
import request from "supertest";
import { UserModel } from "../models/userModel.js";
import { CandidateProfileModel } from "../models/candidateProfile.js";
import mongoose from "mongoose";
import { connectTestDB, disconnectTestDB } from "./testDb.js";
import { createTestUser } from "./helpers/testAuth.js";

let token = "";
let userId = "";

beforeAll(async () => {
    await connectTestDB();

    const user = await createTestUser();

    token = user.token;
    userId = user.userId;
}, 15000);

afterAll(async () => {
    try {
        if (userId && mongoose.connection.readyState === 1) {
            await CandidateProfileModel.deleteMany({ userId });
            await UserModel.deleteOne({ _id: userId });
        }
    } finally {
        await disconnectTestDB();
    }
}, 15000);

describe("profile", () => {
    test("Should get profile when login", async () => {
        const res = await request(app)
            .get("/profile")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toBeDefined();
    });

    test("Should update profile when login", async () => {
        const profileData = {
            needsPermit: true,
            targetRole: "Software Engineer",
            educationLevel: "bachelor",
            yearsExperience: 3,
            skills: ["React", "TypeScript"],
            preferredLocation: "Cork"
        };

        const res = await request(app)
            .put("/profile")
            .set("Authorization", `Bearer ${token}`)
            .send(profileData);

        expect(res.status).toBe(200);

        // 验证实际返回数据
        expect(res.body.data.targetRole).toBe("Software Engineer");
        expect(res.body.data.skills).toEqual(["React", "TypeScript"]);

        // 验证数据库确实保存成功
        const savedProfile = await CandidateProfileModel.findOne({ userId });

        expect(savedProfile).not.toBeNull();
        expect(savedProfile?.targetRole).toBe("Software Engineer");
        expect(savedProfile?.yearsExperience).toBe(3);
        expect(savedProfile?.skills).toEqual(["React", "TypeScript"]);
    });
});