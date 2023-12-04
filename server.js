// import fastify from "fastify";
// import fastifyWebsocket from "@fastify/websocket";
// import fastifyCors from '@fastify/cors'; // Import the fastify-cors plugin
// import { MongoClient } from "mongodb";
import { app } from "./app.js";
import dotenv from "dotenv";
dotenv.config();
// const app = fastify();
// app.register(fastifyWebsocket, {
//   options: { maxPayload: 1048576 },
// });
// app.register(fastifyCors, {
//   origin: '*',
//   methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
// });
// const mongoUrl = process.env.MONGO_URI;
// const dbName = "test";
// const collectionName = "cts";
// const connectToMongoDB = async () => {
//   const client = new MongoClient(mongoUrl);
//   try {
//     await client.connect();
//     console.log("Connected to MongoDB");
//     return client.db(dbName);
//   } catch (error) {
//     console.error("Error connecting to MongoDB:", error);
//     throw error;
//   }
// };

// const collection = await connectToMongoDB();

// const fetchDataFromMongoDB = async (collection) => {
//   const currentTime = new Date();
//   const startTime = new Date(currentTime.getTime() - 60 * 1000); // 15 seconds ago
//   try {
//     const result = await collection
//       .aggregate([
//         {
//           $match: { created_at: { $gte: startTime, $lte: currentTime } },
//         },
//         {
//           $project: {
//             _id: 0,
//             average_current: { $round: ["$CT_Avg", 2] },
//             total_current: { $round: ["$total_current", 2] },
//             timestamp: {
//               $dateToString: {
//                 format: "%Y-%m-%dT%H:%M:%S.%LZ",
//                 date: "$created_at",
//               },
//             },
//           },
//         },
//         {
//           $limit: 1,
//         },
//       ])
//       .toArray();

//     if (result.length === 0) {
//       console.log("No data found for the last 15 seconds.");
//       return {
//         results: "No data available.",
//         status: "error",
//       };
//     }

//     return result[0];
//   } catch (error) {
//     console.error("Error fetching data from MongoDB:", error);
//     throw error;
//   }
// };


// app.register(async (fastify) => {
//   app.get("/", async (request, reply) => {
//     reply.send("Welcome to the home page!");
//   });
//   fastify.get(
//     "/real-time-current-monitoring",
//     { websocket: true },
//     (connection /* SocketStream */, req /* FastifyRequest */) => {
//       const interval = setInterval(async () => {
//         try {
//           const data = await fetchDataFromMongoDB(collection);
//           connection.socket.send(JSON.stringify(data));
//         } catch (error) {
//           console.error("Error fetching data from MongoDB:", error);
//         }
//       }, 5000);
//       connection.socket.on("close", () => {
//         clearInterval(interval);
//       });
//     }
//   );
// });
app.listen({
  port: process.env.PORT,
  host: '0.0.0.0',
}, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

