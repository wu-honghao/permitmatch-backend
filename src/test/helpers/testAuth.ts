import request from "supertest";
import app from "../../app.js";
import { UserModel } from "../../models/userModel.js";
import bcrypt from "bcryptjs";

export async function createTestUser() {
    const email = `test-${crypto.randomUUID()}@example.com`;
    const password = "Test123456!";

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
        email,
        password: hashedPassword
    });

    const res = await request(app)
        .post("/auth/login")
        .send({ email, password });

    if (res.status !== 200 || !res.body.data?.token) {
        throw new Error("Test user login failed");
    }

    return {
        userId: user._id.toString(),
        token: res.body.data.token as string,
        email
    };
}