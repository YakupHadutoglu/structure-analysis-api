import mongoose from "mongoose";
import env from './env';

const connectDB = async (): Promise<void> => {
    try {
        if (!env.MONGO_URI) throw new Error("MONGO_URI is not defined in environment variables");
        await mongoose.connect(env.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (error: unknown) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}

export default connectDB;
