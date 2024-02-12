import { fetchMachinesCurrentState } from "../services/realTimeAlertsService.js";
// ... (other imports)

export default function realTimeAlertsMonitoringRoute(fastify, options, done) {
  fastify.get(
    "/machine-state-monitoring/:labId",
    { websocket: true },
    async (connection /* SocketStream */, req /* FastifyRequest */) => {
       const { db } = options;
      const { labId } = req.params;

      const interval = setInterval(async () => {
        try {
          const machineData = await fetchMachinesCurrentState(db, labId);
          connection.socket.send(JSON.stringify(machineData));
        } catch (error) {
          console.error("Error fetching machine data from MongoDB:", error);
        }
      }, 5000);

      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );
  done();
}
