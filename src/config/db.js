import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { env } from "./env.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: env.isProduction ? 20 : 10,
      minPoolSize: env.isProduction ? 5 : 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(
      `MongoDB Connected! HOST: ${connectionInstance.connection.host}, DB: ${connectionInstance.connection.name}`,
    );
    return connectionInstance;
  } catch (error) {
    logger.error(`MongoDB Connection FAILED: ${error.message}`);
    // Throw error so callers (including serverless handlers) can handle it
    throw error;
  }
};

export default connectDB;
