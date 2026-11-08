import mongoose from "mongoose";
import { config } from "dotenv";

config({ path: ".env.test", override: true });

export async function connectTestDB() {
    const uri = process.env.MONGODB_TEST_URI;

    if (!uri) {
        throw new Error("MONGODB_TEST_URI is required");
    }

    // 先验证连接字符串指定的数据库名称
    const parsed = new URL(uri);
    const dbName = decodeURIComponent(parsed.pathname.slice(1));

    if (dbName !== "permitmatch_test") {
        throw new Error("Unsafe test database URI");
    }

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
    });

    if (mongoose.connection.name !== "permitmatch_test") {
        await mongoose.disconnect();
        throw new Error("Unsafe test database");
    }
}

export async function disconnectTestDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
}