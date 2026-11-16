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

        const server = app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });

        let shuttingDown = false;

        const shutdown = (signal: string) => {
            if (shuttingDown) return;
            shuttingDown = true;

            console.log(`${signal} received. Shutting down...`);

            const timer = setTimeout(() => {
                console.error("Shutdown timed out");
                process.exit(1);
            }, 10000);

            timer.unref();

            server.close(async (error) => {
                try {
                    if (error) throw error;

                    await mongoose.disconnect();

                    clearTimeout(timer);
                    console.log("Server stopped");
                    process.exit(0);
                } catch (error) {
                    console.error("Shutdown failed:", error);
                    process.exit(1);
                }
            });
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

void startServer();