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
const isProduction = process.env.NODE_ENV === "production";
const prefix = isProduction ? "/api/ws" : "/api/ws/development"

app.get(prefix, async (request, reply) => {
  return { status: "OK", message: "Server is running and healthy!", prefix: prefix };
});

app.register(async (fastify) => {
  await fastify.register(realTimeAlertsMonitoringRoute, { prefix, db });
  await fastify.register(realTimeMonitoringRoute, { prefix, db });
});
