import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const startServer = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        const frontendOrigin = process.env.FRONTEND_ORIGIN;
        const port = Number(process.env.PORT ?? 3000);

        if (!mongoUri) {
            throw new Error("MONGODB_URI is not configured");
        }

        if (!frontendOrigin) {
            throw new Error("FRONTEND_ORIGIN is not configured");
        }

        await mongoose.connect(mongoUri);

        console.log("MongoDB connected");

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

void startServer();