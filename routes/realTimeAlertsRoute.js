import { fetchMachinesCurrentState, fetchRealTimeAlerts, checkMachineStateAlerts } from "../services/realTimeAlertsService.js";
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

  fastify.get(
    "/real-time-alert/:userId/:macAddress",
    { websocket: true },
    (connection /* SocketStream */, req /* FastifyRequest */) => {
      const { db } = options;
      const { userId, macAddress } = req.params;
  
      const interval = setInterval(async () => {
        try {
          const alertData = await fetchRealTimeAlerts(db, userId, macAddress);
  
          if (alertData.currentAlert.status !== "error") {
            connection.socket.send(JSON.stringify(alertData.currentAlert));
          }
  
          if (alertData.ambientTempAlert.status !== "error") {
            connection.socket.send(JSON.stringify(alertData.ambientTempAlert));
          }
  
          if (alertData.ambientHumidityAlert.status !== "error") {
            connection.socket.send(JSON.stringify(alertData.ambientHumidityAlert));
          }
        } catch (error) {
          console.error("Error fetching real-time alert data:", error);
        }
      }, 5000);
  
      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );
  

  fastify.get(
    "/machine-state-alerts/:labId",
    { websocket: true },
    (connection /* SocketStream */, req /* FastifyRequest */) => {
      const { db } = options;
      const { labId } = req.params;

      // console.log(labId)
  
      const sendAlerts = (alerts) => {
        for (const alert of alerts) {
          connection.socket.send(JSON.stringify(alert));
        }
      };
  
      const interval = setInterval(async () => {
        try {
          const alerts = await checkMachineStateAlerts(db, labId);
          sendAlerts(alerts);
        } catch (error) {
          console.error("Error checking machine state alerts:", error);
          connection.socket.send(JSON.stringify({ type: "error", message: "An error occurred." }));
        }
      }, 5000); 
  
      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );

  done();
}
