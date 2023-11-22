import fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
const app = fastify();
app.register(fastifyWebsocket, {
  options: { maxPayload: 1048576 },
});
const mongoUrl = process.env.MONGO_URI;
const dbName = "test";
const collectionName = "cts";
const connectToMongoDB = async () => {
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db(dbName).collection(collectionName);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

const collection = await connectToMongoDB();

const fetchDataFromMongoDB = async (collection) => {
  const currentTime = new Date();
  const startTime = new Date(currentTime.getTime() - 10 * 1000); // 15 seconds ago
  try {
    const result = await collection
      .aggregate([
        {
          $match: { created_at: { $gte: startTime, $lte: currentTime } },
        },
        {
          $project: {
            _id: 0,
            average_current: { $round: ["$CT_Avg", 2] },
            total_current: { $round: ["$total_current", 2] },
            timestamp: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S.%LZ",
                date: "$created_at",
              },
            },
          },
        },
        {
          $limit: 1,
        },
      ])
      .toArray();

    if (result.length === 0) {
      console.log("No data found for the last 15 seconds.");
      return {
        results: "No data available.",
        status: "error",
      };
    }

    return result[0];
  } catch (error) {
    console.error("Error fetching data from MongoDB:", error);
    throw error;
  }
};

app.register(async (fastify) => {
  fastify.get(
    "/real-time-current-monitoring",
    { websocket: true },
    (connection /* SocketStream */, req /* FastifyRequest */) => {
      const interval = setInterval(async () => {
        try {
          const data = await fetchDataFromMongoDB(collection);
          connection.socket.send(JSON.stringify(data));
        } catch (error) {
          console.error("Error fetching data from MongoDB:", error);
        }
      }, 5000);
      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );
});
app.listen({
  port: process.env.PORT,
  host: '0.0.0.0',
}, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  } else {
    console.log("Server is running");
  }
});

