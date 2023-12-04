// services/mongoService.js
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const mongoUrl = process.env.MONGO_URI;
const dbName = "test"; // You can make this dynamic if needed

export const connectToMongoDB = async () => {
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db(dbName);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};
