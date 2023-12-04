import fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from '@fastify/cors';
import { connectToMongoDB } from "./services/mongoService.js";
//import homeRoute from './routes/homeRoute.js';
import realTimeMonitoringRoute from './routes/realTimeMonitoringRoute.js';

const app = fastify();
app.register(fastifyWebsocket, { options: { maxPayload: 1048576 } });
app.register(fastifyCors, { origin: '*', methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'] });

const db = await connectToMongoDB();

app.register(async (fastify) => {
  //homeRoute(fastify);
  realTimeMonitoringRoute(fastify, db);
});

export { app };