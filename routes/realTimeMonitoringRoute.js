import fetchRealTimeCurrentData from "../services/realTimeMonitoringService";

export default function realTimeMonitoringRoute(fastify, db) {
    fastify.get(
      "/real-time-current-monitoring/:macAddress",
      { websocket: true },
      (connection /* SocketStream */, req /* FastifyRequest */) => {
        const { macAddress } = req.params;
        const interval = setInterval(async () => {
          try {
            const data = await fetchRealTimeCurrentData(db, macAddress);
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
  }