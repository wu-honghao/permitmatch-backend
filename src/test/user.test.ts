import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { UserModel } from "../models/userModel.js";
import { connectTestDB, disconnectTestDB } from "./testDb.js";
import { createTestUser } from "./helpers/testAuth.js";
import mongoose from "mongoose";

const PASSWORD = "12234444";

let loginUser: Awaited<ReturnType<typeof createTestUser>>;
let duplicateUser: Awaited<ReturnType<typeof createTestUser>>;
let registerEmail: string;

beforeAll(async () => {
    await connectTestDB();

    loginUser = await createTestUser();
    duplicateUser = await createTestUser();

    registerEmail = `register-${crypto.randomUUID()}@example.com`;
}, 15000);

afterAll(async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            await UserModel.deleteMany({
                email: {
                    $in: [
                        loginUser?.email,
                        duplicateUser?.email,
                        registerEmail
                    ].filter(Boolean)
                }
            });
        }
    } finally {
        await disconnectTestDB();
    }
}, 15000);

describe("user", () => {
    it("should return 401 when the login password is wrong", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({
                email: loginUser.email,
                password: "wrong-password"
            });

        expect(res.status).toBe(401);
    });

    it("should return 200 when email and password is correct", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({
                email: loginUser.email,
                password: "Test123456!"
            });

        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeDefined();
    });

    it("should return 201 when registering a new user", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({
                email: registerEmail,
                password: PASSWORD
            });

        expect(res.status).toBe(201);

        const savedUser = await UserModel.findOne({
            email: registerEmail
        });

        expect(savedUser).not.toBeNull();
    });

    it("should return 409 when email already exists", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({
                email: duplicateUser.email,
                password: PASSWORD
            });

        expect(res.status).toBe(409);
    });
});