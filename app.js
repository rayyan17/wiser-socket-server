import fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import { connectToMongoDB } from "./database/db.js";
import realTimeMonitoringRoute from "./routes/realTimeMonitoringRoute.js";
import realTimeAlertsMonitoringRoute from "./routes/realTimeAlertsRoute.js";

export const app = fastify({
  logger: true,
});

app.register(fastifyWebsocket, { options: { maxPayload: 1048576 } });
app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
});

const db = await connectToMongoDB();

app.get("/", async (request, reply) => {
  return { status: "OK", message: "Server is running and healthy!" };
});

app.register(async (fastify) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const prefix = isDevelopment ? "/api/ws/development" : "/api/ws";

  await fastify.register(realTimeAlertsMonitoringRoute, { prefix, db });
  await fastify.register(realTimeMonitoringRoute, { prefix, db });
});
