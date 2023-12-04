import fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from '@fastify/cors';
import { connectToMongoDB } from "./database/db.js";
//import homeRoute from './routes/homeRoute.js';
import realTimeMonitoringRoute from './routes/realTimeMonitoringRoute.js';

export const app = fastify({
  logger: true});
app.register(fastifyWebsocket, { options: { maxPayload: 1048576 } });
app.register(fastifyCors, { origin: '*', methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'] });

const db = await connectToMongoDB();

app.register(async (fastify) => {
  //homeRoute(fastify);
  realTimeMonitoringRoute(fastify, db);
});
