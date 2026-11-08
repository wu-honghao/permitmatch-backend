import { test, expect } from "vitest";
import mongoose from "mongoose";
import { connectTestDB, disconnectTestDB } from "./testDb.js";

test("Connect to MongoDB Atlas test database", async () => {
    try {
        await connectTestDB();

        expect(mongoose.connection.readyState).toBe(1);
        expect(mongoose.connection.name).toBe("permitmatch_test");
    } finally {
        await disconnectTestDB();
    }
}, 15000);